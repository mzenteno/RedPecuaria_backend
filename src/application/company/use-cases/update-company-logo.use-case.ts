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
  type StoredFileInput,
} from '@domain/core/ports/file-storage.port';

const LOGOS_FOLDER = 'logos';

export interface UpdateCompanyLogoInput {
  companyId: string;
  file: StoredFileInput;
}

/**
 * Sube el logo nuevo ANTES de tocar la base (si algo falla guardando el
 * archivo, la empresa se queda como estaba), y borra el logo anterior
 * DESPUÉS de confirmar el `save()` (si algo falla persistiendo, no se pierde
 * el archivo viejo todavía referenciado). El archivo en sí lo maneja
 * `FileStorage` — este caso de uso no sabe si es disco local, S3, etc.
 */
@Injectable()
export class UpdateCompanyLogoUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: UpdateCompanyLogoInput): Promise<Company> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    const previousLogoUrl = company.logoUrl;
    const newLogoUrl = await this.fileStorage.save(LOGOS_FOLDER, input.file);
    company.updateLogo(newLogoUrl);
    const saved = await this.companyRepository.save(company);

    if (previousLogoUrl) {
      await this.fileStorage.remove(previousLogoUrl);
    }

    return saved;
  }
}
