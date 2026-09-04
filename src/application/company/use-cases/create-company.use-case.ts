import { Inject, Injectable } from '@nestjs/common';
import { Company } from '@domain/company/entities/company';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';

export interface CreateCompanyInput {
  name: string;
}

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: CreateCompanyInput): Promise<Company> {
    const company = Company.create({ name: input.name });
    return this.companyRepository.save(company);
  }
}
