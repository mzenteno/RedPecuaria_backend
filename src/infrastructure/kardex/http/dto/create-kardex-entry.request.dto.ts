import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  KARDEX_MOVEMENT_TYPES,
  type KardexMovementType,
} from '@domain/kardex/entities/kardex-entry';

export class CreateKardexEntryRequestDto {
  @IsString()
  @MinLength(1)
  investmentId: string;

  @IsDateString()
  entryDate: string;

  @IsString()
  @MinLength(1)
  detail: string;

  @IsIn(KARDEX_MOVEMENT_TYPES)
  movementType: KardexMovementType;

  /** Obligatorio solo si `movementType === 'venta'` — validado en el caso de
   * uso (`assertKardexInvestor`), no acá (necesita consultar la lista de
   * inversionistas de la inversión). */
  @ValidateIf((dto: CreateKardexEntryRequestDto) => dto.investorUserId !== null)
  @IsString()
  @MinLength(1)
  investorUserId: string | null;

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
