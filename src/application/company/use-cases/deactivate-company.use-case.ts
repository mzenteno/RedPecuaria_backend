import { Inject, Injectable } from '@nestjs/common';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';

export interface DeactivateCompanyInput {
  companyId: string;
}

@Injectable()
export class DeactivateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: DeactivateCompanyInput): Promise<void> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    company.deactivate();
    await this.companyRepository.save(company);
  }
}
