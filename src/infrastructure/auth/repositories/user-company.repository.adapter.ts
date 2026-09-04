import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { UserCompany } from '@domain/auth/entities/user-company';
import { UserCompanyRepository } from '@domain/auth/repositories/user-company.repository';
import { UserCompanyEntity } from '../entities/user-company.entity';

@Injectable()
export class UserCompanyRepositoryAdapter implements UserCompanyRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<UserCompany | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserAndCompany(
    userId: string,
    companyId: string,
    ctx?: TransactionContext,
  ): Promise<UserCompany | null> {
    const row = await this.repository(ctx).findOne({
      where: { userId, companyId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByUserId(
    userId: string,
    ctx?: TransactionContext,
  ): Promise<UserCompany[]> {
    const rows = await this.repository(ctx).find({
      where: { userId, isDeleted: false },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(
    userCompany: UserCompany,
    ctx?: TransactionContext,
  ): Promise<UserCompany> {
    const saved = await this.repository(ctx).save(this.toEntity(userCompany));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<UserCompanyEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(UserCompanyEntity)
      : this.dataSource.getRepository(UserCompanyEntity);
  }

  private toDomain(row: UserCompanyEntity): UserCompany {
    return UserCompany.fromPersistence({
      id: row.id,
      userId: row.userId,
      companyId: row.companyId,
      roleId: row.roleId,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(userCompany: UserCompany): UserCompanyEntity {
    const snapshot = userCompany.toPersistence();
    const row = new UserCompanyEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.userId = snapshot.userId;
    row.companyId = snapshot.companyId;
    row.roleId = snapshot.roleId;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
