import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import {
  KardexEntry,
  type KardexMovementType,
} from '@domain/kardex/entities/kardex-entry';
import {
  KardexEntryRepository,
  FindKardexEntriesParams,
} from '@domain/kardex/repositories/kardex-entry.repository';
import { PaginatedResult } from '@domain/common/paginated-result';
import { KardexEntryEntity } from '../entities/kardex-entry.entity';

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
  ): Promise<PaginatedResult<KardexEntry>> {
    const query = this.repository(ctx)
      .createQueryBuilder('entry')
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
        "(entry.movement_type != 'venta' OR entry.investor_user_id = :restrictSalesToInvestorId)",
        { restrictSalesToInvestorId: params.restrictSalesToInvestorId },
      );
    }

    const [rows, total] = await query
      .orderBy('entry.entry_date', 'ASC')
      .addOrderBy('entry.created_at', 'ASC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount();

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
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
      movementType: row.movementType as KardexMovementType,
      investorUserId: row.investorUserId,
      // `numeric` vuelve como string con el driver `pg` — convertir a mano
      // (mismo gotcha que en `Property`, ver ese adapter).
      avgWeight: Number(row.avgWeight),
      entryQuantity: row.entryQuantity,
      entryKilos: Number(row.entryKilos),
      exitQuantity: row.exitQuantity,
      exitKilos: Number(row.exitKilos),
      balanceQuantity: row.balanceQuantity,
      balanceKilos: Number(row.balanceKilos),
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
    row.movementType = snapshot.movementType;
    row.investorUserId = snapshot.investorUserId;
    row.avgWeight = snapshot.avgWeight;
    row.entryQuantity = snapshot.entryQuantity;
    row.entryKilos = snapshot.entryKilos;
    row.exitQuantity = snapshot.exitQuantity;
    row.exitKilos = snapshot.exitKilos;
    row.balanceQuantity = snapshot.balanceQuantity;
    row.balanceKilos = snapshot.balanceKilos;
    row.total = snapshot.total;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
