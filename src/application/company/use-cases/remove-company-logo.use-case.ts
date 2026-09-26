import { Inject, Injectable } from '@nestjs/common';
import { Company } from '@domain/company/entities/company';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';
import {
  FILE_STORAGE,
  type FileStorage,
} from '@domain/core/ports/file-storage.port';

export interface RemoveCompanyLogoInput {
  companyId: string;
}

@Injectable()
export class RemoveCompanyLogoUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: RemoveCompanyLogoInput): Promise<Company> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    const previousLogoUrl = company.logoUrl;
    company.updateLogo(null);
    const saved = await this.companyRepository.save(company);

    if (previousLogoUrl) {
      await this.fileStorage.remove(previousLogoUrl);
    }

    return saved;
  }
}
