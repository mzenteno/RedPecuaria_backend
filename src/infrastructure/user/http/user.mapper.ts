import { User } from '@domain/user/entities/user';
import { UserResponseDto } from './dto/user.response.dto';

export class UserMapper {
  /** Nunca incluye `passwordHash` — no es asunto de nadie fuera del dominio/infra. */
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email.toString(),
      fullName: user.fullName,
      isDeleted: user.isDeleted,
      userTypeId: user.userTypeId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
