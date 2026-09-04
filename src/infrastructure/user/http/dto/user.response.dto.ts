export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isDeleted: boolean;
  userTypeId: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}
