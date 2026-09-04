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
import { ListInvestmentsByPropertyUseCase } from '@application/investment/use-cases/list-investments-by-property.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { CreateInvestmentRequestDto } from './dto/create-investment.request.dto';
import { UpdateInvestmentRequestDto } from './dto/update-investment.request.dto';
import { ListInvestmentsQueryDto } from './dto/list-investments.query.dto';
import { InvestmentResponseDto } from './dto/investment.response.dto';
import { InvestmentMapper } from './investment.mapper';

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
    private readonly listInvestmentsByPropertyUseCase: ListInvestmentsByPropertyUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateInvestmentRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<InvestmentResponseDto> {
    const investment = await this.createInvestmentUseCase.execute({
      companyId,
      ...dto,
    });
    return InvestmentMapper.toResponse(investment, dto.investorUserIds);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInvestmentRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<InvestmentResponseDto> {
    const investment = await this.updateInvestmentUseCase.execute({
      investmentId: id,
      companyId,
      ...dto,
    });
    return InvestmentMapper.toResponse(investment, dto.investorUserIds);
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

  @Get()
  async list(
    @Query() query: ListInvestmentsQueryDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<InvestmentResponseDto[]> {
    const results = await this.listInvestmentsByPropertyUseCase.execute({
      propertyId: query.propertyId,
      companyId,
    });
    return results.map(({ investment, investorIds }) =>
      InvestmentMapper.toResponse(investment, investorIds),
    );
  }
}
