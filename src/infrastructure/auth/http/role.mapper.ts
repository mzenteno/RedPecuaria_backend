import { Role } from '@domain/auth/entities/role';
import { RoleResponseDto } from './dto/role.response.dto';

export class RoleMapper {
  static toResponse(role: Role): RoleResponseDto {
    return {
      id: role.id,
      companyId: role.companyId,
      name: role.name,
      createdAt: role.createdAt,
    };
  }
}
