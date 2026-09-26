import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateCompanyUseCase } from '@application/company/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '@application/company/use-cases/update-company.use-case';
import { DeactivateCompanyUseCase } from '@application/company/use-cases/deactivate-company.use-case';
import { ListCompaniesUseCase } from '@application/company/use-cases/list-companies.use-case';
import { UpdateCompanyLogoUseCase } from '@application/company/use-cases/update-company-logo.use-case';
import { RemoveCompanyLogoUseCase } from '@application/company/use-cases/remove-company-logo.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import type { AccessTokenPayload } from '@domain/core/ports/token-generator.port';
import { CreateCompanyRequestDto } from './dto/create-company.request.dto';
import { UpdateCompanyRequestDto } from './dto/update-company.request.dto';
import { CompanyResponseDto } from './dto/company.response.dto';
import { CompanyMapper } from './company.mapper';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
];

@Controller('companies')
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly deactivateCompanyUseCase: DeactivateCompanyUseCase,
    private readonly listCompaniesUseCase: ListCompaniesUseCase,
    private readonly updateCompanyLogoUseCase: UpdateCompanyLogoUseCase,
    private readonly removeCompanyLogoUseCase: RemoveCompanyLogoUseCase,
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

  /**
   * `memoryStorage()` explícito (aunque sea el default de multer sin
   * `dest`/`storage`) — dejarlo implícito obligaría a saber ese detalle de
   * memoria; acá `file.buffer` en vez de un path en disco es intencional:
   * quien decide DÓNDE queda el archivo es `FileStorage`
   * (`UpdateCompanyLogoUseCase`), no multer. `fileFilter` rechaza cualquier
   * mimetype que no sea una imagen ANTES de leerlo en memoria.
   */
  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOGO_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_LOGO_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'El logo debe ser una imagen (PNG, JPG, WEBP o SVG)',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CompanyResponseDto> {
    if (!file) {
      throw new BadRequestException('Falta el archivo del logo');
    }
    const company = await this.updateCompanyLogoUseCase.execute({
      companyId: id,
      file: {
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      },
    });
    return CompanyMapper.toResponse(company);
  }

  @Delete(':id/logo')
  async removeLogo(@Param('id') id: string): Promise<CompanyResponseDto> {
    const company = await this.removeCompanyLogoUseCase.execute({
      companyId: id,
    });
    return CompanyMapper.toResponse(company);
  }
}
