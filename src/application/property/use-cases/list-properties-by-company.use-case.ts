import { Inject, Injectable } from '@nestjs/common';
import { Property } from '@domain/property/entities/property';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';

export interface ListPropertiesByCompanyInput extends PaginationParams {
  companyId: string;
}

@Injectable()
export class ListPropertiesByCompanyUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(
    input: ListPropertiesByCompanyInput,
  ): Promise<PaginatedResult<Property>> {
    return this.propertyRepository.findAllPaginated(input);
  }
}
