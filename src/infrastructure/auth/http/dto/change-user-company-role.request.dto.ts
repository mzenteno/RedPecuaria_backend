import { IsString, MinLength } from 'class-validator';

export class ChangeUserCompanyRoleRequestDto {
  @IsString()
  @MinLength(1)
  roleId: string;
}
