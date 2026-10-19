import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Investment } from '@domain/investment/entities/investment';
import { InvestmentInvestor } from '@domain/investment/entities/investment-investor';
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
    if (params.isFinished !== undefined) {
      query.andWhere('ii.is_finished = :isFinished', {
        isFinished: params.isFinished,
      });
    }
    if (params.orderByGestion) {
      query
        .orderBy('investment.gestion', 'ASC')
        .addOrderBy('investment.created_at', 'DESC');
    } else {
      query.orderBy('investment.created_at', 'DESC');
    }

    const [rows, total] = await query
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
    // No se puede borrar y recrear todo a lo bruto como antes: desde que
    // esta fila lleva su propio saldo (`balance_quantity`/`balance_kilos`/
    // `total`, ver `InvestmentInvestor`), borrar y recrear a un inversionista
    // que YA estaba le resetearía el saldo a 0 en cada edición de la
    // inversión (este método se llama siempre, aunque la lista de
    // inversionistas no haya cambiado — ver `UpdateInvestmentUseCase`). Solo
    // se borran los que de verdad se sacan, y solo se insertan los de verdad
    // nuevos; los que quedan igual no se tocan.
    const existing = await repo.find({ where: { investmentId } });
    const existingUserIds = new Set(existing.map((row) => row.userId));
    const nextUserIds = new Set(userIds);

    const removedUserIds = existing
      .filter((row) => !nextUserIds.has(row.userId))
      .map((row) => row.userId);
    if (removedUserIds.length > 0) {
      await repo.delete({ investmentId, userId: In(removedUserIds) });
    }

    const addedUserIds = userIds.filter((id) => !existingUserIds.has(id));
    if (addedUserIds.length === 0) {
      return;
    }
    const rows = addedUserIds.map((userId) => {
      const row = new InvestmentInvestorEntity();
      row.investmentId = investmentId;
      row.userId = userId;
      row.createdAt = new Date();
      return row;
    });
    await repo.save(rows);
  }

  async findInvestmentInvestor(
    investmentId: string,
    userId: string,
    ctx?: TransactionContext,
  ): Promise<InvestmentInvestor | null> {
    const row = await this.investorRepository(ctx).findOne({
      where: { investmentId, userId },
    });
    return row ? this.investorToDomain(row) : null;
  }

  async findInvestmentInvestors(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<InvestmentInvestor[]> {
    const rows = await this.investorRepository(ctx).find({
      where: { investmentId },
    });
    return rows.map((row) => this.investorToDomain(row));
  }

  async saveInvestmentInvestor(
    investmentInvestor: InvestmentInvestor,
    ctx?: TransactionContext,
  ): Promise<InvestmentInvestor> {
    const saved = await this.investorRepository(ctx).save(
      this.investorToEntity(investmentInvestor),
    );
    return this.investorToDomain(saved);
  }

  private investorToDomain(row: InvestmentInvestorEntity): InvestmentInvestor {
    return InvestmentInvestor.fromPersistence({
      id: row.id,
      investmentId: row.investmentId,
      userId: row.userId,
      // `numeric` vuelve como string con el driver `pg` — mismo gotcha que
      // en `Investment`/`KardexEntry`.
      balanceQuantity: row.balanceQuantity,
      balanceKilos: Number(row.balanceKilos),
      total: Number(row.total),
      isFinished: row.isFinished,
      createdAt: row.createdAt,
    });
  }

  private investorToEntity(
    investmentInvestor: InvestmentInvestor,
  ): InvestmentInvestorEntity {
    const snapshot = investmentInvestor.toPersistence();
    const row = new InvestmentInvestorEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.investmentId = snapshot.investmentId;
    row.userId = snapshot.userId;
    row.balanceQuantity = snapshot.balanceQuantity;
    row.balanceKilos = snapshot.balanceKilos;
    row.total = snapshot.total;
    row.isFinished = snapshot.isFinished;
    row.createdAt = snapshot.createdAt;
    return row;
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
      investmentTypeId: row.investmentTypeId,
      gestion: row.gestion,
      description: row.description,
      // `numeric` vuelve como string con el driver `pg` — convertir a mano
      // (mismo gotcha que en `KardexEntry`/`Property`).
      balanceQuantity: row.balanceQuantity,
      balanceKilos: Number(row.balanceKilos),
      total: Number(row.total),
      isFinished: row.isFinished,
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
    row.investmentTypeId = snapshot.investmentTypeId;
    row.gestion = snapshot.gestion;
    row.description = snapshot.description;
    row.balanceQuantity = snapshot.balanceQuantity;
    row.balanceKilos = snapshot.balanceKilos;
    row.total = snapshot.total;
    row.isFinished = snapshot.isFinished;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
