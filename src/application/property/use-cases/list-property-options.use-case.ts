import { Inject, Injectable } from '@nestjs/common';
import { Property } from '@domain/property/entities/property';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';

/**
 * Para combos (Propiedad en Inversiones/Kardex) — a propósito separado de
 * `ListPropertiesByCompanyUseCase` (el CRUD paginado): un `<select>` no
 * pagina, necesita todas las opciones de una vez, no una página con `id`+
 * `name` nada más (ver `PropertyOptionResponseDto`).
 */
@Injectable()
export class ListPropertyOptionsUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(companyId: string): Promise<Property[]> {
    return this.propertyRepository.findOptionsByCompany(companyId);
  }
}
