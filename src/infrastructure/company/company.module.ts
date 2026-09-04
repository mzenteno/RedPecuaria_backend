import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { COMPANY_REPOSITORY } from '@domain/company/repositories/company.repository';
import { CompanyEntity } from './entities/company.entity';
import { CompanyRepositoryAdapter } from './repositories/company.repository.adapter';
import { CreateCompanyUseCase } from '@application/company/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '@application/company/use-cases/update-company.use-case';
import { DeactivateCompanyUseCase } from '@application/company/use-cases/deactivate-company.use-case';
import { ListCompaniesUseCase } from '@application/company/use-cases/list-companies.use-case';
import { CompanyController } from './http/company.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  controllers: [CompanyController],
  providers: [
    { provide: COMPANY_REPOSITORY, useClass: CompanyRepositoryAdapter },
    CreateCompanyUseCase,
    UpdateCompanyUseCase,
    DeactivateCompanyUseCase,
    ListCompaniesUseCase,
  ],
  exports: [COMPANY_REPOSITORY],
})
export class CompanyModule {}
