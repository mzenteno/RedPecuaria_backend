import { MovementType } from '@domain/kardex/entities/movement-type';
import { MovementTypeResponseDto } from './dto/movement-type.response.dto';

export class MovementTypeMapper {
  static toResponse(movementType: MovementType): MovementTypeResponseDto {
    return {
      id: movementType.id,
      name: movementType.name,
      isDeleted: movementType.isDeleted,
      createdAt: movementType.createdAt,
    };
  }
}
