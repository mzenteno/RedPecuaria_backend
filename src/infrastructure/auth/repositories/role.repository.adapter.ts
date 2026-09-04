import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Role } from '@domain/auth/entities/role';
import { RoleRepository } from '@domain/auth/repositories/role.repository';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepositoryAdapter implements RoleRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(id: string, ctx?: TransactionContext): Promise<Role | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByCompanyAndName(
    companyId: string,
    name: string,
    ctx?: TransactionContext,
  ): Promise<Role | null> {
    const row = await this.repository(ctx).findOne({
      where: { companyId, name },
    });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByCompany(
    companyId: string,
    ctx?: TransactionContext,
  ): Promise<Role[]> {
    const rows = await this.repository(ctx).find({
      where: { companyId, isDeleted: false },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(role: Role, ctx?: TransactionContext): Promise<Role> {
    const saved = await this.repository(ctx).save(this.toEntity(role));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<RoleEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(RoleEntity)
      : this.dataSource.getRepository(RoleEntity);
  }

  private toDomain(row: RoleEntity): Role {
    return Role.fromPersistence({
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(role: Role): RoleEntity {
    const snapshot = role.toPersistence();
    const row = new RoleEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.companyId = snapshot.companyId;
    row.name = snapshot.name;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
