import { Inject, Injectable } from '@nestjs/common';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { PropertyNotFoundException } from '@domain/property/exceptions/property-not-found.exception';

export interface DeactivatePropertyInput {
  propertyId: string;
  companyId: string;
}

@Injectable()
export class DeactivatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: DeactivatePropertyInput): Promise<void> {
    const property = await this.propertyRepository.findById(input.propertyId);
    if (!property || property.companyId !== input.companyId) {
      throw new PropertyNotFoundException(input.propertyId);
    }

    property.deactivate();
    await this.propertyRepository.save(property);
  }
}
