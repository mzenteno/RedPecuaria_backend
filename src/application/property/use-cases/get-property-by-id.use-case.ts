import { Inject, Injectable } from '@nestjs/common';
import { Property } from '@domain/property/entities/property';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { PropertyNotFoundException } from '@domain/property/exceptions/property-not-found.exception';

export interface GetPropertyByIdInput {
  propertyId: string;
  companyId: string;
}

/**
 * Detalle de una propiedad — para la pantalla de edición del frontend
 * (`/properties/:id`, antes un diálogo que reusaba la fila del listado). Al
 * ser una ruta propia tiene que poder cargarse sola (recargar la página,
 * abrir el link). Mismo criterio que `GetInvestmentByIdUseCase`: 404
 * genérico si es de otra empresa o está dada de baja.
 */
@Injectable()
export class GetPropertyByIdUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: GetPropertyByIdInput): Promise<Property> {
    const property = await this.propertyRepository.findById(input.propertyId);
    if (
      !property ||
      property.isDeleted ||
      property.companyId !== input.companyId
    ) {
      throw new PropertyNotFoundException(input.propertyId);
    }
    return property;
  }
}
