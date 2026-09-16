import { UserType } from '@domain/user/entities/user-type';
import { UserTypeResponseDto } from './dto/user-type.response.dto';

export class UserTypeMapper {
  static toResponse(userType: UserType): UserTypeResponseDto {
    return {
      id: userType.id,
      name: userType.name,
      createdAt: userType.createdAt,
    };
  }
}
