import { Inject, Injectable } from '@nestjs/common';
import { Property } from '@domain/property/entities/property';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';

export interface ListPropertiesByCompanyInput {
  companyId: string;
}

@Injectable()
export class ListPropertiesByCompanyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: ListPropertiesByCompanyInput): Promise<Property[]> {
    return this.propertyRepository.findActiveByCompany(input.companyId);
  }
}
