import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { KardexEntry } from '@domain/kardex/entities/kardex-entry';
import { KardexEntryRepository } from '@domain/kardex/repositories/kardex-entry.repository';
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
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<KardexEntry[]> {
    const rows = await this.repository(ctx).find({
      where: { investmentId, isDeleted: false },
      order: { entryDate: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
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
