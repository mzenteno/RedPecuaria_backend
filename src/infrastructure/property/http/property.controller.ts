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
import { CreatePropertyUseCase } from '@application/property/use-cases/create-property.use-case';
import { UpdatePropertyUseCase } from '@application/property/use-cases/update-property.use-case';
import { DeactivatePropertyUseCase } from '@application/property/use-cases/deactivate-property.use-case';
import { ListPropertiesByCompanyUseCase } from '@application/property/use-cases/list-properties-by-company.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { CreatePropertyRequestDto } from './dto/create-property.request.dto';
import { UpdatePropertyRequestDto } from './dto/update-property.request.dto';
import { PropertyResponseDto } from './dto/property.response.dto';
import { PropertyMapper } from './property.mapper';

/** Sin `companyId` en la URL/body: siempre la empresa activa de la sesión
 * (`@CurrentUser('companyId')`) — mismo criterio que `Role`/`User`. */
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly updatePropertyUseCase: UpdatePropertyUseCase,
    private readonly deactivatePropertyUseCase: DeactivatePropertyUseCase,
    private readonly listPropertiesByCompanyUseCase: ListPropertiesByCompanyUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreatePropertyRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<PropertyResponseDto> {
    const property = await this.createPropertyUseCase.execute({
      companyId,
      ...dto,
    });
    return PropertyMapper.toResponse(property);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<PropertyResponseDto> {
    const property = await this.updatePropertyUseCase.execute({
      propertyId: id,
      companyId,
      ...dto,
    });
    return PropertyMapper.toResponse(property);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<void> {
    await this.deactivatePropertyUseCase.execute({ propertyId: id, companyId });
  }

  @Get()
  async list(
    @CurrentUser('companyId') companyId: string,
  ): Promise<PropertyResponseDto[]> {
    const properties = await this.listPropertiesByCompanyUseCase.execute({
      companyId,
    });
    return properties.map((property) => PropertyMapper.toResponse(property));
  }
}
