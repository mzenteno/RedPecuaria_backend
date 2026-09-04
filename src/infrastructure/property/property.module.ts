import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROPERTY_REPOSITORY } from '@domain/property/repositories/property.repository';
import { PropertyEntity } from './entities/property.entity';
import { PropertyRepositoryAdapter } from './repositories/property.repository.adapter';
import { CreatePropertyUseCase } from '@application/property/use-cases/create-property.use-case';
import { UpdatePropertyUseCase } from '@application/property/use-cases/update-property.use-case';
import { DeactivatePropertyUseCase } from '@application/property/use-cases/deactivate-property.use-case';
import { ListPropertiesByCompanyUseCase } from '@application/property/use-cases/list-properties-by-company.use-case';
import { PropertyController } from './http/property.controller';

/**
 * Propiedad (finca ganadera) — primer módulo del negocio ganadero en sí,
 * ver docs/property/property.md.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PropertyEntity])],
  controllers: [PropertyController],
  providers: [
    { provide: PROPERTY_REPOSITORY, useClass: PropertyRepositoryAdapter },
    CreatePropertyUseCase,
    UpdatePropertyUseCase,
    DeactivatePropertyUseCase,
    ListPropertiesByCompanyUseCase,
  ],
  exports: [PROPERTY_REPOSITORY],
})
export class PropertyModule {}
