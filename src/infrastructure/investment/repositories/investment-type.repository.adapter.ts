import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { InvestmentType } from '@domain/investment/entities/investment-type';
import { InvestmentTypeRepository } from '@domain/investment/repositories/investment-type.repository';
import { InvestmentTypeEntity } from '../entities/investment-type.entity';

@Injectable()
export class InvestmentTypeRepositoryAdapter implements InvestmentTypeRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<InvestmentType | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(ctx?: TransactionContext): Promise<InvestmentType[]> {
    const rows = await this.repository(ctx).find();
    return rows.map((row) => this.toDomain(row));
  }

  private repository(
    ctx?: TransactionContext,
  ): Repository<InvestmentTypeEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(InvestmentTypeEntity)
      : this.dataSource.getRepository(InvestmentTypeEntity);
  }

  private toDomain(row: InvestmentTypeEntity): InvestmentType {
    return InvestmentType.fromPersistence({
      id: row.id,
      name: row.name,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }
}
