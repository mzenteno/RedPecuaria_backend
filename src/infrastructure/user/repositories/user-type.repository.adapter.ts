import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { UserType } from '@domain/user/entities/user-type';
import { UserTypeRepository } from '@domain/user/repositories/user-type.repository';
import { UserTypeEntity } from '../entities/user-type.entity';

@Injectable()
export class UserTypeRepositoryAdapter implements UserTypeRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<UserType | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(ctx?: TransactionContext): Promise<UserType[]> {
    const rows = await this.repository(ctx).find();
    return rows.map((row) => this.toDomain(row));
  }

  async save(userType: UserType, ctx?: TransactionContext): Promise<UserType> {
    const saved = await this.repository(ctx).save(this.toEntity(userType));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<UserTypeEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(UserTypeEntity)
      : this.dataSource.getRepository(UserTypeEntity);
  }

  private toDomain(row: UserTypeEntity): UserType {
    return UserType.fromPersistence({
      id: row.id,
      name: row.name,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(userType: UserType): UserTypeEntity {
    const snapshot = userType.toPersistence();
    const row = new UserTypeEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.name = snapshot.name;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
