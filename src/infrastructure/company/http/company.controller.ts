import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateCompanyUseCase } from '@application/company/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '@application/company/use-cases/update-company.use-case';
import { DeactivateCompanyUseCase } from '@application/company/use-cases/deactivate-company.use-case';
import { ListCompaniesUseCase } from '@application/company/use-cases/list-companies.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import type { AccessTokenPayload } from '@domain/core/ports/token-generator.port';
import { CreateCompanyRequestDto } from './dto/create-company.request.dto';
import { UpdateCompanyRequestDto } from './dto/update-company.request.dto';
import { CompanyResponseDto } from './dto/company.response.dto';
import { CompanyMapper } from './company.mapper';

@Controller('companies')
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly deactivateCompanyUseCase: DeactivateCompanyUseCase,
    private readonly listCompaniesUseCase: ListCompaniesUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateCompanyRequestDto,
  ): Promise<CompanyResponseDto> {
    const company = await this.createCompanyUseCase.execute(dto);
    return CompanyMapper.toResponse(company);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyRequestDto,
  ): Promise<CompanyResponseDto> {
    const company = await this.updateCompanyUseCase.execute({
      companyId: id,
      name: dto.name,
    });
    return CompanyMapper.toResponse(company);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string): Promise<void> {
    await this.deactivateCompanyUseCase.execute({ companyId: id });
  }

  @Get()
  async list(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<CompanyResponseDto[]> {
    const companies = await this.listCompaniesUseCase.execute({
      isSuperAdmin: user.isSuperAdmin,
      companyId: user.companyId,
    });
    return companies.map((company) => CompanyMapper.toResponse(company));
  }
}
