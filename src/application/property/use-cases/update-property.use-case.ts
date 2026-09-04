import { Inject, Injectable } from '@nestjs/common';
import { Property } from '@domain/property/entities/property';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { PropertyNotFoundException } from '@domain/property/exceptions/property-not-found.exception';
import { PropertyAlreadyExistsException } from '@domain/property/exceptions/property-already-exists.exception';

export interface UpdatePropertyInput {
  propertyId: string;
  companyId: string;
  name: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class UpdatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: UpdatePropertyInput): Promise<Property> {
    const property = await this.propertyRepository.findById(input.propertyId);
    if (!property || property.companyId !== input.companyId) {
      throw new PropertyNotFoundException(input.propertyId);
    }

    if (property.name !== input.name) {
      const existing = await this.propertyRepository.findByCompanyAndName(
        input.companyId,
        input.name,
      );
      if (existing) {
        throw new PropertyAlreadyExistsException(input.name);
      }
    }

    property.update({
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
    });
    return this.propertyRepository.save(property);
  }
}
