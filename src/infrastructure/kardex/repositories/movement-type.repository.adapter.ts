import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { MovementType } from '@domain/kardex/entities/movement-type';
import { MovementTypeRepository } from '@domain/kardex/repositories/movement-type.repository';
import { KardexMovementTypeEntity } from '../entities/kardex-movement-type.entity';

@Injectable()
export class MovementTypeRepositoryAdapter implements MovementTypeRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<MovementType | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(ctx?: TransactionContext): Promise<MovementType[]> {
    const rows = await this.repository(ctx).find();
    return rows.map((row) => this.toDomain(row));
  }

  async save(
    movementType: MovementType,
    ctx?: TransactionContext,
  ): Promise<MovementType> {
    const saved = await this.repository(ctx).save(this.toEntity(movementType));
    return this.toDomain(saved);
  }

  private repository(
    ctx?: TransactionContext,
  ): Repository<KardexMovementTypeEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(KardexMovementTypeEntity)
      : this.dataSource.getRepository(KardexMovementTypeEntity);
  }

  private toDomain(row: KardexMovementTypeEntity): MovementType {
    return MovementType.fromPersistence({
      id: row.id,
      name: row.name,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(movementType: MovementType): KardexMovementTypeEntity {
    const snapshot = movementType.toPersistence();
    const row = new KardexMovementTypeEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.name = snapshot.name;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
