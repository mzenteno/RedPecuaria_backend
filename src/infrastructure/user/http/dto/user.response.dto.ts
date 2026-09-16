export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  userTypeId: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}
