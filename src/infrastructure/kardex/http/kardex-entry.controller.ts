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
import { CreateKardexEntryUseCase } from '@application/kardex/use-cases/create-kardex-entry.use-case';
import { UpdateKardexEntryUseCase } from '@application/kardex/use-cases/update-kardex-entry.use-case';
import { DeactivateKardexEntryUseCase } from '@application/kardex/use-cases/deactivate-kardex-entry.use-case';
import { ListKardexEntriesByInvestmentUseCase } from '@application/kardex/use-cases/list-kardex-entries-by-investment.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { CreateKardexEntryRequestDto } from './dto/create-kardex-entry.request.dto';
import { UpdateKardexEntryRequestDto } from './dto/update-kardex-entry.request.dto';
import { ListKardexEntriesQueryDto } from './dto/list-kardex-entries.query.dto';
import { KardexEntryResponseDto } from './dto/kardex-entry.response.dto';
import { KardexEntryListItemResponseDto } from './dto/kardex-entry-list-item.response.dto';
import { KardexEntryMapper } from './kardex-entry.mapper';
import { PaginatedResponseDto } from '@infrastructure/common/http/paginated-response.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/** `investmentId` explícito (igual criterio que `propertyId` en
 * `InvestmentController`) — `companyId` siempre implícito por sesión,
 * validado contra la cadena Investment → Property → Company. */
@Controller('kardex-entries')
export class KardexEntryController {
  constructor(
    private readonly createKardexEntryUseCase: CreateKardexEntryUseCase,
    private readonly updateKardexEntryUseCase: UpdateKardexEntryUseCase,
    private readonly deactivateKardexEntryUseCase: DeactivateKardexEntryUseCase,
    private readonly listKardexEntriesByInvestmentUseCase: ListKardexEntriesByInvestmentUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateKardexEntryRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<KardexEntryResponseDto> {
    const entry = await this.createKardexEntryUseCase.execute({
      companyId,
      ...dto,
    });
    return KardexEntryMapper.toResponse(entry);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKardexEntryRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<KardexEntryResponseDto> {
    const entry = await this.updateKardexEntryUseCase.execute({
      entryId: id,
      companyId,
      ...dto,
    });
    return KardexEntryMapper.toResponse(entry);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<void> {
    await this.deactivateKardexEntryUseCase.execute({
      entryId: id,
      companyId,
    });
  }

  @Get()
  async list(
    @Query() query: ListKardexEntriesQueryDto,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('isInvestor') isInvestor: boolean,
    @CurrentUser('sub') userId: string,
  ): Promise<PaginatedResponseDto<KardexEntryListItemResponseDto>> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.listKardexEntriesByInvestmentUseCase.execute({
      page,
      pageSize,
      investmentId: query.investmentId,
      companyId,
      search: query.search,
      viewerIsInvestor: isInvestor,
      viewerUserId: userId,
    });
    return {
      data: result.items.map((item) => KardexEntryMapper.toListResponse(item)),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  }
}
