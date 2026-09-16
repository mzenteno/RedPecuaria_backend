import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateInvestmentUseCase } from '@application/investment/use-cases/create-investment.use-case';
import { UpdateInvestmentUseCase } from '@application/investment/use-cases/update-investment.use-case';
import { DeactivateInvestmentUseCase } from '@application/investment/use-cases/deactivate-investment.use-case';
import { ListInvestmentsByPropertyPaginatedUseCase } from '@application/investment/use-cases/list-investments-by-property-paginated.use-case';
import { ListInvestmentsByInvestorUseCase } from '@application/investment/use-cases/list-investments-by-investor.use-case';
import { ListInvestmentsByGestionUseCase } from '@application/investment/use-cases/list-investments-by-gestion.use-case';
import { GetInvestmentByIdUseCase } from '@application/investment/use-cases/get-investment-by-id.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { CreateInvestmentRequestDto } from './dto/create-investment.request.dto';
import { UpdateInvestmentRequestDto } from './dto/update-investment.request.dto';
import { ListInvestmentsByGestionQueryDto } from './dto/list-investments-by-gestion.query.dto';
import { ListInvestmentsByPropertyPaginatedQueryDto } from './dto/list-investments-by-property-paginated.query.dto';
import { ListInvestmentsByInvestorQueryDto } from './dto/list-investments-by-investor.query.dto';
import { ListMyInvestmentsQueryDto } from './dto/list-my-investments.query.dto';
import { InvestmentResponseDto } from './dto/investment.response.dto';
import { InvestmentListItemResponseDto } from './dto/investment-list-item.response.dto';
import { InvestmentMapper } from './investment.mapper';
import { PaginatedResponseDto } from '@infrastructure/common/http/paginated-response.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * `propertyId` sí es explícito (a diferencia de `companyId`, siempre
 * implícito por sesión) — una empresa tiene varias propiedades, no hay una
 * "propiedad activa" de la sesión, el usuario elige con cuál trabajar en
 * cada pantalla. Igual se valida que esa propiedad sea de la empresa activa
 * (ver los casos de uso), nunca se confía en el `propertyId` a ciegas.
 */
@Controller('investments')
export class InvestmentController {
  constructor(
    private readonly createInvestmentUseCase: CreateInvestmentUseCase,
    private readonly updateInvestmentUseCase: UpdateInvestmentUseCase,
    private readonly deactivateInvestmentUseCase: DeactivateInvestmentUseCase,
    private readonly listInvestmentsByPropertyPaginatedUseCase: ListInvestmentsByPropertyPaginatedUseCase,
    private readonly listInvestmentsByInvestorUseCase: ListInvestmentsByInvestorUseCase,
    private readonly listInvestmentsByGestionUseCase: ListInvestmentsByGestionUseCase,
    private readonly getInvestmentByIdUseCase: GetInvestmentByIdUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateInvestmentRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<InvestmentResponseDto> {
    const { investment, propertyName } =
      await this.createInvestmentUseCase.execute({
        companyId,
        ...dto,
      });
    return InvestmentMapper.toResponse(
      investment,
      dto.investorUserIds,
      propertyName,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInvestmentRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<InvestmentResponseDto> {
    const { investment, propertyName } =
      await this.updateInvestmentUseCase.execute({
        investmentId: id,
        companyId,
        ...dto,
      });
    return InvestmentMapper.toResponse(
      investment,
      dto.investorUserIds,
      propertyName,
    );
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<void> {
    await this.deactivateInvestmentUseCase.execute({
      investmentId: id,
      companyId,
    });
  }

  /** Para la pantalla de Inversiones: "Gestión" dispara la consulta (de
   * cualquier propiedad de la empresa), paginado en el servidor —
   * "Propiedad"/"Inversionista" son filtros opcionales adicionales,
   * también resueltos en el servidor. */
  @Get('by-gestion')
  async listByGestion(
    @Query() query: ListInvestmentsByGestionQueryDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<PaginatedResponseDto<InvestmentListItemResponseDto>> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.listInvestmentsByGestionUseCase.execute({
      page,
      pageSize,
      gestion: query.gestion,
      companyId,
      propertyId: query.propertyId,
      investorUserId: query.investorUserId,
      search: query.search,
    });
    return {
      data: result.items.map(({ investment, investorIds, propertyName }) =>
        InvestmentMapper.toListResponse(investment, investorIds, propertyName),
      ),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  /** Para la pantalla de Inversiones: "Propiedad" también dispara la
   * consulta por sí sola (sin "Gestión" ni "Inversionista" elegidos),
   * paginado en el servidor — mismo criterio que `by-gestion`/
   * `by-investor`, con "Gestión"/"Inversionista" como filtros opcionales
   * adicionales. */
  @Get('by-property')
  async listByProperty(
    @Query() query: ListInvestmentsByPropertyPaginatedQueryDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<PaginatedResponseDto<InvestmentListItemResponseDto>> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.listInvestmentsByPropertyPaginatedUseCase.execute(
      {
        page,
        pageSize,
        propertyId: query.propertyId,
        companyId,
        gestion: query.gestion,
        investorUserId: query.investorUserId,
        search: query.search,
      },
    );
    return {
      data: result.items.map(({ investment, investorIds, propertyName }) =>
        InvestmentMapper.toListResponse(investment, investorIds, propertyName),
      ),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  /** Para la pantalla de Inversiones: buscar todas las inversiones de un
   * inversionista puntual, de cualquier gestión y cualquier propiedad —
   * a diferencia de `mine`, acá `investorUserId` sí es explícito (un
   * administrador buscando a cualquier inversionista de su empresa, no
   * "las mías"). Sigue sin ser un hueco de seguridad: ya se puede ver la
   * misma inversión navegando por "Gestión", esto es solo otra forma de
   * llegar a la misma información, con la empresa activa igual de
   * implícita/validada (ver `findByInvestor`). */
  @Get('by-investor')
  async listByInvestor(
    @Query() query: ListInvestmentsByInvestorQueryDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<PaginatedResponseDto<InvestmentListItemResponseDto>> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.listInvestmentsByInvestorUseCase.execute({
      page,
      pageSize,
      investorUserId: query.investorUserId,
      companyId,
      propertyId: query.propertyId,
      search: query.search,
    });
    return {
      data: result.items.map(({ investment, investorIds, propertyName }) =>
        InvestmentMapper.toListResponse(investment, investorIds, propertyName),
      ),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  /** "Mis inversiones" — para la pantalla de Kardex de un usuario tipo
   * Inversionista. `userId` sale de la sesión (`@CurrentUser('sub')`),
   * nunca de un parámetro del cliente. */
  @Get('mine')
  async listMine(
    @Query() query: ListMyInvestmentsQueryDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<PaginatedResponseDto<InvestmentListItemResponseDto>> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.listInvestmentsByInvestorUseCase.execute({
      page,
      pageSize,
      investorUserId: userId,
      companyId,
    });
    return {
      data: result.items.map(({ investment, investorIds, propertyName }) =>
        InvestmentMapper.toListResponse(investment, investorIds, propertyName),
      ),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }

  /**
   * Detalle completo de una inversión (con saldo) — a propósito una ruta
   * LITERAL... no, esta sí es `:id` (dinámica) — pero va AL FINAL de todas
   * las rutas literales (`by-gestion`/`by-property`/`by-investor`/`mine`):
   * si fuera antes, Nest la matchearía primero y esas rutas nunca se
   * alcanzarían (mismo cuidado que `GET /users/options` antes de
   * `GET /users/:id`, pero al revés — acá la dinámica va última). Usado por
   * `InvestmentDialog` (edición) y Kardex ("Saldo actual"), que ya no
   * dependen del listado para esto (ver el change de este cambio).
   */
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<InvestmentResponseDto> {
    const { investment, investorIds, propertyName } =
      await this.getInvestmentByIdUseCase.execute({
        investmentId: id,
        companyId,
      });
    return InvestmentMapper.toResponse(investment, investorIds, propertyName);
  }
}
