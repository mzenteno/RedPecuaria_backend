import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListKardexEntriesQueryDto {
  @IsString()
  @MinLength(1)
  investmentId: string;

  /** Obligatorio — el Kardex siempre se pide acotado a un inversionista
   * puntual, ver `assertKardexInvestor`/`ListKardexEntriesByInvestmentUseCase`. */
  @IsString()
  @MinLength(1)
  investorUserId: string;

  /** Coincidencia parcial en `detail` (ver
   * `KardexEntryRepositoryAdapter.findActiveByInvestment`). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
