import { Inject, Injectable } from '@nestjs/common';
import { Company } from '@domain/company/entities/company';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';

export interface UpdateCompanyInput {
  companyId: string;
  name: string;
}

@Injectable()
export class UpdateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: UpdateCompanyInput): Promise<Company> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    company.rename(input.name);
    return this.companyRepository.save(company);
  }
}
