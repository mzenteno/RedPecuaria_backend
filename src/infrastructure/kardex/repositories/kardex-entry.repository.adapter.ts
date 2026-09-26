import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { KardexEntry } from '@domain/kardex/entities/kardex-entry';
import {
  KardexEntryRepository,
  KardexEntryWithRunningBalance,
  KardexEntriesPage,
  FindKardexEntriesParams,
} from '@domain/kardex/repositories/kardex-entry.repository';
import { KardexEntryEntity } from '../entities/kardex-entry.entity';

interface RunningBalanceRaw {
  runningBalanceQuantity: string;
  runningBalanceKilos: string;
  runningBalanceTotal: string;
  movementTypeName: string;
  investorName: string | null;
  debe: string;
  haber: string;
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
  ): Promise<KardexEntriesPage> {
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
            WHEN "movementType"."name" = 'baja' THEN -entry.avg_weight
            ELSE 0
          END
        ) OVER (ORDER BY entry.entry_date, entry.created_at)`,
        'runningBalanceKilos',
      )
      // Equivalente en dinero, para inversiones "por dinero" — mismo signo
      // que `computeMovementDelta` en ese modo (Ingreso suma, Venta resta
      // `total`, al revés que en modo "kilo" donde Venta siempre lo suma;
      // Baja resta `avg_weight`, igual criterio que en modo "kilo" — nunca
      // `total`, para no ensuciar Debe/Haber, ver `computeMovementDelta`).
      // Se calcula siempre, sin mirar el tipo de la inversión (esta query
      // ya está acotada a una sola inversión) — el frontend elige cuál de
      // los dos mostrar.
      .addSelect(
        `SUM(
          CASE
            WHEN "movementType"."name" = 'ingreso' THEN entry.total
            WHEN "movementType"."name" = 'venta' THEN -entry.total
            WHEN "movementType"."name" = 'baja' THEN -entry.avg_weight
            ELSE 0
          END
        ) OVER (ORDER BY entry.entry_date, entry.created_at)`,
        'runningBalanceTotal',
      )
      // Nombre del tipo de movimiento y del inversionista, resueltos acá —
      // no con un segundo fetch aparte cruzado a mano del lado del cliente
      // (bug real, ver el change de este cambio). `movementType` ya estaba
      // joineado (lo necesita el cálculo de arriba); `investor` es un JOIN
      // nuevo, `LEFT` porque `investor_user_id` es nulo salvo en "venta".
      .addSelect('movementType.name', 'movementTypeName')
      .addSelect('investor.full_name', 'investorName')
      // Debe/Haber por fila — Ingreso es "Debe" (siempre `entry.total`,
      // dato que el usuario tipea en Ingreso sin importar el tipo de
      // inversión). Venta es "Haber" (`entry.total` también, mismo
      // criterio). Baja es "Haber" SOLO si la inversión es "por dinero"
      // (`bajaHaberExpr`): en ese modo `avg_weight` es el monto en Bs. que
      // salió (dato real de esa fila); en modo "kilo" `avg_weight` es
      // merma en KILOS, no dinero — sumarlo acá ensuciaría el footer
      // Debe/Haber con un número que no es plata (bug real, encontrado en
      // vivo: la Baja mermaba el saldo bien pero nunca aparecía en Haber,
      // ver docs/investment/changes/2026-09-26-baja-en-el-haber.md).
      .addSelect(
        `CASE WHEN "movementType"."name" = 'ingreso' THEN entry.total ELSE 0 END`,
        'debe',
      )
      .addSelect(
        `CASE
          WHEN "movementType"."name" = 'venta' THEN entry.total
          WHEN "movementType"."name" = 'baja' THEN ${params.investmentTypeIsDinero ? 'entry.avg_weight' : '0'}
          ELSE 0
        END`,
        'haber',
      )
      .orderBy('entry.entry_date', 'ASC')
      .addOrderBy('entry.created_at', 'ASC');

    const { entities, raw } =
      await query.getRawAndEntities<RunningBalanceRaw>();
    const allItems: KardexEntryWithRunningBalance[] = entities.map(
      (row, index) => ({
        entry: this.toDomain(row),
        runningBalanceQuantity: Number(raw[index]?.runningBalanceQuantity ?? 0),
        runningBalanceKilos: Number(raw[index]?.runningBalanceKilos ?? 0),
        runningBalanceTotal: Number(raw[index]?.runningBalanceTotal ?? 0),
        movementTypeName: raw[index]?.movementTypeName ?? '—',
        investorName: raw[index]?.investorName ?? null,
        debe: Number(raw[index]?.debe ?? 0),
        haber: Number(raw[index]?.haber ?? 0),
      }),
    );

    // Debe/Haber de TODO el historial activo (no solo la página) — para el
    // footer de la tabla en el frontend. Se suma acá, sobre `allItems`
    // (antes de recortar la página), porque es donde ya está la lista
    // completa en memoria — nunca sobre `items` (la página), que daría un
    // total incompleto si hay más de una página. `debe`/`haber` ya vienen
    // resueltos por fila desde el SQL de arriba (incluye la Baja cuando
    // corresponde) — no hay que volver a mirar `movementTypeName` acá.
    let totalDebe = 0;
    let totalHaber = 0;
    for (const item of allItems) {
      totalDebe += item.debe;
      totalHaber += item.haber;
    }

    const start = (params.page - 1) * params.pageSize;
    return {
      items: allItems.slice(start, start + params.pageSize),
      total: allItems.length,
      page: params.page,
      pageSize: params.pageSize,
      totalDebe,
      totalHaber,
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
      // `LEFT` (no `inner`): `investor_user_id` es nulo salvo en "venta" —
      // resuelve el nombre para el listado, ver `findActiveByInvestment`.
      .leftJoin('users', 'investor', 'investor.id = entry.investor_user_id')
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
