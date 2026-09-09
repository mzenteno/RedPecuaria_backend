import {
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateKardexEntryRequestDto {
  @IsDateString()
  entryDate: string;

  @IsString()
  @MinLength(1)
  detail: string;

  /** Ver el comentario en `CreateKardexEntryRequestDto`. */
  @IsString()
  @MinLength(1)
  movementTypeId: string;

  /** Ver el comentario en `CreateKardexEntryRequestDto`. */
  @ValidateIf((dto: UpdateKardexEntryRequestDto) => dto.investorUserId !== null)
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

  /** Ver el comentario en `CreateKardexEntryRequestDto`. */
  @IsNumber()
  @Min(0)
  total: number;
}
