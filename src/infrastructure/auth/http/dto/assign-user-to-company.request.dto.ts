import { IsString, MinLength } from 'class-validator';

export class AssignUserToCompanyRequestDto {
  @IsString()
  @MinLength(1)
  companyId: string;

  @IsString()
  @MinLength(1)
  roleId: string;
}
