import { User } from '@domain/user/entities/user';
import { UserWithType } from '@domain/user/repositories/user.repository';
import { UserResponseDto } from './dto/user.response.dto';
import { UserListItemResponseDto } from './dto/user-list-item.response.dto';
import { UserOptionResponseDto } from './dto/user-option.response.dto';

export class UserMapper {
  /** Nunca incluye `passwordHash` — no es asunto de nadie fuera del dominio/infra. */
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email.toString(),
      fullName: user.fullName,
      userTypeId: user.userTypeId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  static toListResponse(item: UserWithType): UserListItemResponseDto {
    return {
      id: item.user.id,
      username: item.user.username,
      email: item.user.email.toString(),
      fullName: item.user.fullName,
      userTypeName: item.userTypeName,
      lastLoginAt: item.user.lastLoginAt,
      createdAt: item.user.createdAt,
    };
  }

  static toOptionResponse(user: User): UserOptionResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
    };
  }
}
