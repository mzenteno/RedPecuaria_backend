import { Inject, Injectable } from '@nestjs/common';
import { Property } from '@domain/property/entities/property';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { PropertyAlreadyExistsException } from '@domain/property/exceptions/property-already-exists.exception';

export interface CreatePropertyInput {
  companyId: string;
  name: string;
  latitude: number;
  longitude: number;
}

@Injectable()
export class CreatePropertyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: CreatePropertyInput): Promise<Property> {
    const existing = await this.propertyRepository.findByCompanyAndName(
      input.companyId,
      input.name,
    );
    if (existing) {
      throw new PropertyAlreadyExistsException(input.name);
    }

    const property = Property.create(input);
    return this.propertyRepository.save(property);
  }
}
