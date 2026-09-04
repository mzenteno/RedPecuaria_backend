import {
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateKardexEntryRequestDto {
  @IsString()
  @MinLength(1)
  investmentId: string;

  @IsDateString()
  entryDate: string;

  @IsString()
  @MinLength(1)
  detail: string;

  @IsNumber()
  @Min(0)
  avgWeight: number;

  @IsInt()
  @Min(0)
  entryQuantity: number;

  @IsNumber()
  @Min(0)
  entryKilos: number;

  @IsInt()
  @Min(0)
  exitQuantity: number;

  @IsNumber()
  @Min(0)
  exitKilos: number;

  @IsInt()
  @Min(0)
  balanceQuantity: number;

  @IsNumber()
  @Min(0)
  balanceKilos: number;

  @IsNumber()
  total: number;
}
