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

export class CreateInvestmentRequestDto {
  @IsString()
  @MinLength(1)
  propertyId: string;

  /** Fijo desde la creación — no existe en `UpdateInvestmentRequestDto`,
   * no se puede cambiar después (ver docs/investment/investment.md). */
  @IsString()
  @MinLength(1)
  investmentTypeId: string;

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
