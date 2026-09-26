import { Inject, Injectable } from '@nestjs/common';
import { Company } from '@domain/company/entities/company';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';

export interface UpdateCompanyLogoInput {
  companyId: string;
  file: { buffer: Buffer; mimeType: string };
}

/**
 * Guarda la imagen tal cual, como `data:` URI en base64, directo en
 * `logoUrl` — no en un archivo aparte (disco/S3/etc.). Se eligió así (a
 * pedido del usuario, 2026-09-26) tras encontrar en producción que el disco
 * local de un servicio de Render es efímero: cualquier archivo subido se
 * pierde en el siguiente deploy/reinicio. Guardarlo en la propia fila de
 * `companies` lo hace sobrevivir a eso sin depender de ningún storage
 * externo — el costo es que cada logo pesa hasta ~2,7 MB de texto en la
 * base (ver `docs/company/changes/2026-09-26-logo-en-base64-no-en-disco.md`
 * para el detalle completo, incluidas las alternativas descartadas).
 */
@Injectable()
export class UpdateCompanyLogoUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: UpdateCompanyLogoInput): Promise<Company> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    const logoUrl = `data:${input.file.mimeType};base64,${input.file.buffer.toString('base64')}`;
    company.updateLogo(logoUrl);
    return this.companyRepository.save(company);
  }
}
