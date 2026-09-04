import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Investment } from '@domain/investment/entities/investment';
import { InvestmentRepository } from '@domain/investment/repositories/investment.repository';
import { InvestmentEntity } from '../entities/investment.entity';
import { InvestmentInvestorEntity } from '../entities/investment-investor.entity';

@Injectable()
export class InvestmentRepositoryAdapter implements InvestmentRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<Investment | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByProperty(
    propertyId: string,
    ctx?: TransactionContext,
  ): Promise<Investment[]> {
    const rows = await this.repository(ctx).find({
      where: { propertyId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(
    investment: Investment,
    ctx?: TransactionContext,
  ): Promise<Investment> {
    const saved = await this.repository(ctx).save(this.toEntity(investment));
    return this.toDomain(saved);
  }

  async findInvestorIds(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<string[]> {
    const rows = await this.investorRepository(ctx).find({
      where: { investmentId },
    });
    return rows.map((row) => row.userId);
  }

  async replaceInvestors(
    investmentId: string,
    userIds: string[],
    ctx?: TransactionContext,
  ): Promise<void> {
    const repo = this.investorRepository(ctx);
    await repo.delete({ investmentId });
    if (userIds.length === 0) {
      return;
    }
    const rows = userIds.map((userId) => {
      const row = new InvestmentInvestorEntity();
      row.investmentId = investmentId;
      row.userId = userId;
      row.createdAt = new Date();
      return row;
    });
    await repo.save(rows);
  }

  private repository(ctx?: TransactionContext): Repository<InvestmentEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(InvestmentEntity)
      : this.dataSource.getRepository(InvestmentEntity);
  }

  private investorRepository(
    ctx?: TransactionContext,
  ): Repository<InvestmentInvestorEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(InvestmentInvestorEntity)
      : this.dataSource.getRepository(InvestmentInvestorEntity);
  }

  private toDomain(row: InvestmentEntity): Investment {
    return Investment.fromPersistence({
      id: row.id,
      propertyId: row.propertyId,
      gestion: row.gestion,
      description: row.description,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(investment: Investment): InvestmentEntity {
    const snapshot = investment.toPersistence();
    const row = new InvestmentEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.propertyId = snapshot.propertyId;
    row.gestion = snapshot.gestion;
    row.description = snapshot.description;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
