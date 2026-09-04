import { IsString, MinLength } from 'class-validator';

export class UpdateCompanyRequestDto {
  @IsString()
  @MinLength(1)
  name: string;
}
