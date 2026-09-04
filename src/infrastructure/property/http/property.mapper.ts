import { Property } from '@domain/property/entities/property';
import { PropertyResponseDto } from './dto/property.response.dto';

export class PropertyMapper {
  static toResponse(property: Property): PropertyResponseDto {
    return {
      id: property.id,
      companyId: property.companyId,
      name: property.name,
      latitude: property.latitude,
      longitude: property.longitude,
      isDeleted: property.isDeleted,
      createdAt: property.createdAt,
    };
  }
}
