import { IsString, MinLength } from 'class-validator';

export class SwitchCompanyRequestDto {
  @IsString()
  @MinLength(1)
  companyId: string;
}
