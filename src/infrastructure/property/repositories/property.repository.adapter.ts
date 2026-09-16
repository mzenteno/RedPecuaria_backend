import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Property } from '@domain/property/entities/property';
import {
  PropertyRepository,
  FindPropertiesParams,
} from '@domain/property/repositories/property.repository';
import { PaginatedResult } from '@domain/common/paginated-result';
import { PropertyEntity } from '../entities/property.entity';

@Injectable()
export class PropertyRepositoryAdapter implements PropertyRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<Property | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByCompanyAndName(
    companyId: string,
    name: string,
    ctx?: TransactionContext,
  ): Promise<Property | null> {
    const row = await this.repository(ctx).findOne({
      where: { companyId, name },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAllPaginated(
    params: FindPropertiesParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Property>> {
    const query = this.repository(ctx)
      .createQueryBuilder('property')
      .where('property.company_id = :companyId', {
        companyId: params.companyId,
      })
      .andWhere('property.is_deleted = false');

    if (params.search) {
      query.andWhere('property.name ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    const [rows, total] = await query
      .orderBy('property.name', 'ASC')
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

  async findOptionsByCompany(
    companyId: string,
    ctx?: TransactionContext,
  ): Promise<Property[]> {
    const rows = await this.repository(ctx)
      .createQueryBuilder('property')
      .where('property.company_id = :companyId', { companyId })
      .andWhere('property.is_deleted = false')
      .orderBy('property.name', 'ASC')
      .getMany();
    return rows.map((row) => this.toDomain(row));
  }

  async save(property: Property, ctx?: TransactionContext): Promise<Property> {
    const saved = await this.repository(ctx).save(this.toEntity(property));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<PropertyEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(PropertyEntity)
      : this.dataSource.getRepository(PropertyEntity);
  }

  private toDomain(row: PropertyEntity): Property {
    return Property.fromPersistence({
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      // `numeric` en Postgres vuelve como string con el driver `pg` — hay
      // que convertirlo a mano, si no el dominio termina con un string
      // donde espera un number (mismo gotcha para cualquier columna
      // `numeric`/`decimal` de este módulo, ver `kardex`).
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(property: Property): PropertyEntity {
    const snapshot = property.toPersistence();
    const row = new PropertyEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.companyId = snapshot.companyId;
    row.name = snapshot.name;
    row.latitude = snapshot.latitude;
    row.longitude = snapshot.longitude;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
