import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  DashboardRepository,
  InvestorDashboardSummary,
  InvestorInvestmentSummary,
  AdminDashboardSummary,
  TopInvestorSummary,
  RecentMovementSummary,
} from '@domain/dashboard/repositories/dashboard.repository';
import { KardexEntryEntity } from '@infrastructure/kardex/entities/kardex-entry.entity';
import { InvestmentEntity } from '@infrastructure/investment/entities/investment.entity';
import { PropertyEntity } from '@infrastructure/property/entities/property.entity';

const RECENT_MOVEMENTS_LIMIT = 5;
const TOP_INVESTORS_LIMIT = 5;

interface InvestorInvestmentRow {
  investmentId: string;
  gestion: number;
  description: string;
  propertyName: string;
}

/**
 * Único repositorio del proyecto que corta transversalmente varios
 * agregados (Kardex, Investment, Property, User) en vez de vivir dentro de
 * "su" módulo — un dashboard es exactamente eso, un modelo de lectura sobre
 * datos de otros bounded contexts, no un agregado propio con invariantes.
 * Por simplicidad (ver ARCHITECTURE.md) inyecta las entidades TypeORM
 * directo (`@InjectRepository`, registradas de nuevo acá vía
 * `TypeOrmModule.forFeature` en `dashboard.module.ts`) en vez de pasar por
 * los repositorios de dominio de cada módulo — esos exponen operaciones
 * pensadas para su propio caso de uso (paginado, CRUD), no los `JOIN`s y
 * agregaciones que necesita este reporte.
 */
@Injectable()
export class DashboardRepositoryAdapter implements DashboardRepository {
  constructor(
    @InjectRepository(KardexEntryEntity)
    private readonly kardexRepository: Repository<KardexEntryEntity>,
    @InjectRepository(InvestmentEntity)
    private readonly investmentRepository: Repository<InvestmentEntity>,
    @InjectRepository(PropertyEntity)
    private readonly propertyRepository: Repository<PropertyEntity>,
  ) {}

  async getInvestorSummary(
    companyId: string,
    userId: string,
  ): Promise<InvestorDashboardSummary> {
    const investmentRows = await this.investmentRepository
      .createQueryBuilder('investment')
      .innerJoin(
        'investment_investors',
        'ii',
        'ii.investment_id = investment.id AND ii.user_id = :userId',
        { userId },
      )
      .innerJoin(
        PropertyEntity,
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId AND property.is_deleted = false',
        { companyId },
      )
      .where('investment.is_deleted = false')
      .select('investment.id', 'investmentId')
      .addSelect('investment.gestion', 'gestion')
      .addSelect('investment.description', 'description')
      .addSelect('property.name', 'propertyName')
      .orderBy('investment.gestion', 'DESC')
      .addOrderBy('investment.id', 'DESC')
      .getRawMany<InvestorInvestmentRow>();

    // Un usuario suele participar de un puñado de inversiones (no cientos),
    // así que una consulta más por inversión (el "último" movimiento de su
    // kardex) es aceptable acá — mismo criterio pragmático que
    // `useInvestorUsers` en el frontend ("v1 shortcut", ver ARCHITECTURE.md).
    // Si esto llega a pesar de verdad, se reemplaza por un `DISTINCT ON`
    // (Postgres) en una sola consulta.
    const investments: InvestorInvestmentSummary[] = [];
    for (const row of investmentRows) {
      const lastEntry = await this.kardexRepository
        .createQueryBuilder('entry')
        .where('entry.investment_id = :investmentId', {
          investmentId: row.investmentId,
        })
        .andWhere('entry.is_deleted = false')
        .orderBy('entry.entry_date', 'DESC')
        .addOrderBy('entry.created_at', 'DESC')
        .getOne();

      investments.push({
        investmentId: row.investmentId,
        propertyName: row.propertyName,
        gestion: row.gestion,
        description: row.description,
        currentBalanceQuantity: lastEntry?.balanceQuantity ?? 0,
        currentBalanceKilos: lastEntry ? Number(lastEntry.balanceKilos) : 0,
      });
    }

    const totalSalesReceived = await this.sumSales(companyId, { userId });

    return {
      investmentsCount: investments.length,
      totalSalesReceived,
      investments,
    };
  }

  async getAdminSummary(companyId: string): Promise<AdminDashboardSummary> {
    const [
      propertiesCount,
      activeInvestmentsCount,
      investorsCount,
      totalSalesAmount,
      topInvestors,
      recentMovements,
    ] = await Promise.all([
      this.propertyRepository.count({
        where: { companyId, isDeleted: false },
      }),
      this.countActiveInvestments(companyId),
      this.countInvestors(companyId),
      this.sumSales(companyId),
      this.getTopInvestors(companyId),
      this.getRecentMovements(companyId),
    ]);

    return {
      propertiesCount,
      activeInvestmentsCount,
      investorsCount,
      totalSalesAmount,
      topInvestors,
      recentMovements,
    };
  }

  private async countActiveInvestments(companyId: string): Promise<number> {
    return this.investmentRepository
      .createQueryBuilder('investment')
      .innerJoin(
        PropertyEntity,
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId AND property.is_deleted = false',
        { companyId },
      )
      .where('investment.is_deleted = false')
      .getCount();
  }

  private async countInvestors(companyId: string): Promise<number> {
    const { count } = (await this.investmentRepository
      .createQueryBuilder('investment')
      .innerJoin(
        'investment_investors',
        'ii',
        'ii.investment_id = investment.id',
      )
      .innerJoin(
        PropertyEntity,
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId AND property.is_deleted = false',
        { companyId },
      )
      .where('investment.is_deleted = false')
      .select('COUNT(DISTINCT ii.user_id)', 'count')
      .getRawOne<{ count: string }>()) ?? { count: '0' };
    return Number(count ?? 0);
  }

  /** `SUM(kardexEntry.total)` de movimientos "venta", acotado a la empresa
   * (siempre) y opcionalmente a un inversionista puntual — el único cálculo
   * de dinero con significado bien definido hoy (ver el comentario en
   * `domain/dashboard/repositories/dashboard.repository.ts`). */
  private async sumSales(
    companyId: string,
    filter?: { userId: string },
  ): Promise<number> {
    const query = this.kardexRepository
      .createQueryBuilder('entry')
      .innerJoin(
        InvestmentEntity,
        'investment',
        'investment.id = entry.investment_id AND investment.is_deleted = false',
      )
      .innerJoin(
        PropertyEntity,
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId AND property.is_deleted = false',
        { companyId },
      )
      .where('entry.is_deleted = false')
      .andWhere('entry.movement_type = :movementType', {
        movementType: 'venta',
      });

    if (filter?.userId) {
      query.andWhere('entry.investor_user_id = :userId', {
        userId: filter.userId,
      });
    }

    const { total } = (await query
      .select('COALESCE(SUM(entry.total), 0)', 'total')
      .getRawOne<{ total: string }>()) ?? { total: '0' };
    return Number(total ?? 0);
  }

  private async getTopInvestors(
    companyId: string,
  ): Promise<TopInvestorSummary[]> {
    const rows = await this.kardexRepository
      .createQueryBuilder('entry')
      .innerJoin(
        InvestmentEntity,
        'investment',
        'investment.id = entry.investment_id AND investment.is_deleted = false',
      )
      .innerJoin(
        PropertyEntity,
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId AND property.is_deleted = false',
        { companyId },
      )
      .innerJoin('users', 'user', 'user.id = entry.investor_user_id')
      .where('entry.is_deleted = false')
      .andWhere('entry.movement_type = :movementType', {
        movementType: 'venta',
      })
      .select('entry.investor_user_id', 'userId')
      .addSelect('user.full_name', 'fullName')
      .addSelect('SUM(entry.total)', 'totalSalesReceived')
      .groupBy('entry.investor_user_id')
      .addGroupBy('user.full_name')
      .orderBy('"totalSalesReceived"', 'DESC')
      .limit(TOP_INVESTORS_LIMIT)
      .getRawMany<{
        userId: string;
        fullName: string;
        totalSalesReceived: string;
      }>();

    return rows.map((row) => ({
      userId: row.userId,
      fullName: row.fullName,
      totalSalesReceived: Number(row.totalSalesReceived),
    }));
  }

  private async getRecentMovements(
    companyId: string,
  ): Promise<RecentMovementSummary[]> {
    const rows = await this.kardexRepository
      .createQueryBuilder('entry')
      .innerJoin(
        InvestmentEntity,
        'investment',
        'investment.id = entry.investment_id AND investment.is_deleted = false',
      )
      .innerJoin(
        PropertyEntity,
        'property',
        'property.id = investment.property_id AND property.company_id = :companyId AND property.is_deleted = false',
        { companyId },
      )
      .where('entry.is_deleted = false')
      .select('entry.id', 'id')
      // `TO_CHAR` en vez del valor crudo: `getRawMany()` no pasa por la
      // hidratación de TypeORM (la que sabe devolver una columna `date`
      // como texto `YYYY-MM-DD`, ver `KardexEntryEntity`) — sin esto, el
      // driver de Postgres la entrega como un `Date` y se serializa como
      // timestamp completo, rompiendo la regla de "fecha pura, sin hora"
      // del resto de la app (ver `docs/investment/investment.md`).
      .addSelect("TO_CHAR(entry.entry_date, 'YYYY-MM-DD')", 'entryDate')
      .addSelect('entry.detail', 'detail')
      .addSelect('entry.movement_type', 'movementType')
      .addSelect('entry.total', 'total')
      .addSelect('property.name', 'propertyName')
      .addSelect('investment.description', 'investmentDescription')
      .orderBy('entry.entry_date', 'DESC')
      .addOrderBy('entry.created_at', 'DESC')
      .limit(RECENT_MOVEMENTS_LIMIT)
      .getRawMany<{
        id: string;
        entryDate: string;
        detail: string;
        movementType: string;
        total: string;
        propertyName: string;
        investmentDescription: string;
      }>();

    return rows.map((row) => ({
      id: row.id,
      entryDate: row.entryDate,
      detail: row.detail,
      movementType: row.movementType,
      total: Number(row.total),
      propertyName: row.propertyName,
      investmentDescription: row.investmentDescription,
    }));
  }
}
