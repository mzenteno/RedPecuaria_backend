import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { KardexEntry } from '@domain/kardex/entities/kardex-entry';
import {
  KardexEntryRepository,
  KardexEntryWithRunningBalance,
  FindKardexEntriesParams,
} from '@domain/kardex/repositories/kardex-entry.repository';
import { PaginatedResult } from '@domain/common/paginated-result';
import { KardexEntryEntity } from '../entities/kardex-entry.entity';

interface RunningBalanceRaw {
  runningBalanceQuantity: string;
  runningBalanceKilos: string;
}

@Injectable()
export class KardexEntryRepositoryAdapter implements KardexEntryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<KardexEntry | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByInvestment(
    params: FindKardexEntriesParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<KardexEntryWithRunningBalance>> {
    // Saldo corrido (cantidad/kilos) después de cada movimiento — calculado
    // acá con una función de ventana SQL sobre TODOS los movimientos activos
    // de la inversión. Nunca se guarda (ver `KardexEntryWithRunningBalance`).
    // La fórmula replica `computeMovementDelta` (application/kardex) en
    // SQL: Ingreso suma cantidad/kilos, Baja solo resta cantidad (no toca
    // kilos), Venta resta cantidad y kilos.
    //
    // Se pagina EN MEMORIA, no con `skip`/`take` de TypeORM: combinar
    // `skip`/`take` con un `JOIN` hace que TypeORM envuelva la consulta en
    // una subconsulta que resuelve la página ANTES de aplicar la ventana —
    // cada página terminaba viendo la función de ventana calculada solo
    // sobre sus propias filas, no sobre el historial completo (verificado
    // en vivo, ver el change de este cambio). El historial de UNA inversión
    // puntual es acotado en la práctica (decenas de filas, no miles) —
    // paginar acá es un compromiso pragmático razonable, mismo criterio que
    // el N+1 aceptado en el Dashboard.
    const query = this.buildFilteredQuery(params, ctx)
      .addSelect(
        `SUM(
          CASE
            WHEN "movementType"."name" = 'ingreso' THEN entry.entry_quantity
            ELSE -entry.exit_quantity
          END
        ) OVER (ORDER BY entry.entry_date, entry.created_at)`,
        'runningBalanceQuantity',
      )
      .addSelect(
        `SUM(
          CASE
            WHEN "movementType"."name" = 'ingreso' THEN entry.entry_kilos
            WHEN "movementType"."name" = 'venta' THEN -entry.exit_kilos
            ELSE 0
          END
        ) OVER (ORDER BY entry.entry_date, entry.created_at)`,
        'runningBalanceKilos',
      )
      .orderBy('entry.entry_date', 'ASC')
      .addOrderBy('entry.created_at', 'ASC');

    const { entities, raw } = await query.getRawAndEntities<RunningBalanceRaw>();
    const allItems: KardexEntryWithRunningBalance[] = entities.map((row, index) => ({
      entry: this.toDomain(row),
      runningBalanceQuantity: Number(raw[index]?.runningBalanceQuantity ?? 0),
      runningBalanceKilos: Number(raw[index]?.runningBalanceKilos ?? 0),
    }));

    const start = (params.page - 1) * params.pageSize;
    return {
      items: allItems.slice(start, start + params.pageSize),
      total: allItems.length,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /** Filtros compartidos por el conteo (`getCount`) y la consulta paginada
   * con saldo corrido — el join a `kardex_movement_types` es incondicional
   * (no solo cuando hay `restrictSalesToInvestorId`) porque la fórmula del
   * saldo corrido también necesita el nombre del tipo de movimiento. */
  private buildFilteredQuery(
    params: FindKardexEntriesParams,
    ctx?: TransactionContext,
  ): SelectQueryBuilder<KardexEntryEntity> {
    const query = this.repository(ctx)
      .createQueryBuilder('entry')
      .innerJoin(
        'kardex_movement_types',
        'movementType',
        'movementType.id = entry.movement_type_id',
      )
      .where('entry.investment_id = :investmentId', {
        investmentId: params.investmentId,
      })
      .andWhere('entry.is_deleted = false');

    if (params.search) {
      query.andWhere('entry.detail ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    if (params.restrictSalesToInvestorId) {
      // "ingreso"/"baja" pasan siempre (son generales, sin inversionista) —
      // solo "venta" se filtra a las que le corresponden a este
      // inversionista puntual.
      query.andWhere(
        "(movementType.name != 'venta' OR entry.investor_user_id = :restrictSalesToInvestorId)",
        { restrictSalesToInvestorId: params.restrictSalesToInvestorId },
      );
    }

    return query;
  }

  async hasAnyActiveEntry(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<boolean> {
    const count = await this.repository(ctx).count({
      where: { investmentId, isDeleted: false },
    });
    return count > 0;
  }

  async save(
    entry: KardexEntry,
    ctx?: TransactionContext,
  ): Promise<KardexEntry> {
    const saved = await this.repository(ctx).save(this.toEntity(entry));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<KardexEntryEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(KardexEntryEntity)
      : this.dataSource.getRepository(KardexEntryEntity);
  }

  private toDomain(row: KardexEntryEntity): KardexEntry {
    return KardexEntry.fromPersistence({
      id: row.id,
      investmentId: row.investmentId,
      entryDate: row.entryDate,
      detail: row.detail,
      movementTypeId: row.movementTypeId,
      investorUserId: row.investorUserId,
      // `numeric` vuelve como string con el driver `pg` — convertir a mano
      // (mismo gotcha que en `Property`, ver ese adapter).
      avgWeight: Number(row.avgWeight),
      entryQuantity: row.entryQuantity,
      entryKilos: Number(row.entryKilos),
      exitQuantity: row.exitQuantity,
      exitKilos: Number(row.exitKilos),
      total: Number(row.total),
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(entry: KardexEntry): KardexEntryEntity {
    const snapshot = entry.toPersistence();
    const row = new KardexEntryEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.investmentId = snapshot.investmentId;
    row.entryDate = snapshot.entryDate;
    row.detail = snapshot.detail;
    row.movementTypeId = snapshot.movementTypeId;
    row.investorUserId = snapshot.investorUserId;
    row.avgWeight = snapshot.avgWeight;
    row.entryQuantity = snapshot.entryQuantity;
    row.entryKilos = snapshot.entryKilos;
    row.exitQuantity = snapshot.exitQuantity;
    row.exitKilos = snapshot.exitKilos;
    row.total = snapshot.total;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
