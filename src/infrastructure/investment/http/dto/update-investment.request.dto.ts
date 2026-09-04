import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MIN_GESTION = 2000;
const MAX_GESTION = 2100;

export class UpdateInvestmentRequestDto {
  @IsInt()
  @Min(MIN_GESTION)
  @Max(MAX_GESTION)
  gestion: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  investorUserIds: string[];
}
