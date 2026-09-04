import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Company } from '@domain/company/entities/company';
import { CompanyRepository } from '@domain/company/repositories/company.repository';
import { CompanyEntity } from '../entities/company.entity';

@Injectable()
export class CompanyRepositoryAdapter implements CompanyRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<Company | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAllActive(ctx?: TransactionContext): Promise<Company[]> {
    const rows = await this.repository(ctx).find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(company: Company, ctx?: TransactionContext): Promise<Company> {
    const saved = await this.repository(ctx).save(this.toEntity(company));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<CompanyEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(CompanyEntity)
      : this.dataSource.getRepository(CompanyEntity);
  }

  private toDomain(row: CompanyEntity): Company {
    return Company.fromPersistence({
      id: row.id,
      name: row.name,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(company: Company): CompanyEntity {
    const snapshot = company.toPersistence();
    const row = new CompanyEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.name = snapshot.name;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
