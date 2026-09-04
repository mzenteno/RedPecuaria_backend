import { Inject, Injectable } from '@nestjs/common';
import { Company } from '@domain/company/entities/company';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';

export interface ListCompaniesInput {
  /** Calculado al emitir el token (`UserType.isSuperAdmin()`), ver
   * `LoginUseCase`/`RefreshTokenUseCase` — evita que este módulo dependa del
   * módulo de usuarios solo para esta decisión. */
  isSuperAdmin: boolean;
  /** La empresa de la sesión actual — se usa si el usuario no es Super Administrador. */
  companyId: string;
}

/**
 * Super Administrador ve todas las empresas; Administrador e Inversionista
 * solo ven la empresa de su sesión actual.
 */
@Injectable()
export class ListCompaniesUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: ListCompaniesInput): Promise<Company[]> {
    if (input.isSuperAdmin) {
      return this.companyRepository.findAllActive();
    }

    const company = await this.companyRepository.findById(input.companyId);
    return company ? [company] : [];
  }
}
