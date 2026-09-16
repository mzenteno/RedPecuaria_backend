import { Property } from '@domain/property/entities/property';
import { PropertyResponseDto } from './dto/property.response.dto';
import { PropertyOptionResponseDto } from './dto/property-option.response.dto';

export class PropertyMapper {
  static toResponse(property: Property): PropertyResponseDto {
    return {
      id: property.id,
      companyId: property.companyId,
      name: property.name,
      latitude: property.latitude,
      longitude: property.longitude,
      createdAt: property.createdAt,
    };
  }

  static toOptionResponse(property: Property): PropertyOptionResponseDto {
    return {
      id: property.id,
      name: property.name,
    };
  }
}
