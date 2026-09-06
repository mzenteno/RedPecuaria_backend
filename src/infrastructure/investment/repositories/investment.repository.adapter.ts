import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Investment } from '@domain/investment/entities/investment';
import {
  InvestmentRepository,
  FindInvestmentsByInvestorParams,
  FindInvestmentsByGestionParams,
  FindInvestmentsByPropertyParams,
} from '@domain/investment/repositories/investment.repository';
import { PaginatedResult } from '@domain/common/paginated-result';
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

  async findByInvestor(
    params: FindInvestmentsByInvestorParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Investment>> {
    // Sin relación ORM declarada (mismo criterio que el resto del proyecto,
    // ver `UserRepositoryAdapter.findAllPaginated`) — joins explícitos
    // contra `investment_investors` (para filtrar por inversionista) y
    // `properties` (para validar la empresa, sin confiar en nada del lado
    // del cliente).
    const query = this.repository(ctx)
      .createQueryBuilder('investment')
      .innerJoin(
        'investment_investors',
        'ii',
        'ii.investment_id = investment.id AND ii.user_id = :investorUserId',
        { investorUserId: params.investorUserId },
      )
      .innerJoin(
        'properties',
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId',
        { companyId: params.companyId },
      )
      .where('investment.is_deleted = false');

    if (params.propertyId) {
      query.andWhere('investment.property_id = :propertyId', {
        propertyId: params.propertyId,
      });
    }
    if (params.search) {
      query.andWhere('investment.description ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    const [rows, total] = await query
      .orderBy('investment.created_at', 'DESC')
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

  async findActiveByCompanyAndGestion(
    params: FindInvestmentsByGestionParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Investment>> {
    const query = this.repository(ctx)
      .createQueryBuilder('investment')
      .innerJoin(
        'properties',
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId',
        { companyId: params.companyId },
      )
      .where('investment.gestion = :gestion', { gestion: params.gestion })
      .andWhere('investment.is_deleted = false');

    if (params.propertyId) {
      query.andWhere('investment.property_id = :propertyId', {
        propertyId: params.propertyId,
      });
    }
    if (params.investorUserId) {
      query.innerJoin(
        'investment_investors',
        'ii',
        'ii.investment_id = investment.id AND ii.user_id = :investorUserId',
        { investorUserId: params.investorUserId },
      );
    }
    if (params.search) {
      query.andWhere('investment.description ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    const [rows, total] = await query
      .orderBy('investment.created_at', 'DESC')
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

  async findActiveByPropertyPaginated(
    params: FindInvestmentsByPropertyParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Investment>> {
    const query = this.repository(ctx)
      .createQueryBuilder('investment')
      .innerJoin(
        'properties',
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId',
        { companyId: params.companyId },
      )
      .where('investment.property_id = :propertyId', {
        propertyId: params.propertyId,
      })
      .andWhere('investment.is_deleted = false');

    if (params.gestion) {
      query.andWhere('investment.gestion = :gestion', {
        gestion: params.gestion,
      });
    }
    if (params.investorUserId) {
      query.innerJoin(
        'investment_investors',
        'ii',
        'ii.investment_id = investment.id AND ii.user_id = :investorUserId',
        { investorUserId: params.investorUserId },
      );
    }
    if (params.search) {
      query.andWhere('investment.description ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    const [rows, total] = await query
      .orderBy('investment.created_at', 'DESC')
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
