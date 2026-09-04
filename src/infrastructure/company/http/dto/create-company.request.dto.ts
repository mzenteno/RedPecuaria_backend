import { IsString, MinLength } from 'class-validator';

export class CreateCompanyRequestDto {
  @IsString()
  @MinLength(1)
  name: string;
}
