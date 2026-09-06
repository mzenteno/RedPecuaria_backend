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

export class ListInvestmentsByInvestorQueryDto {
  @IsString()
  @MinLength(1)
  investorUserId: string;

  /** Solo tiene sentido en `by-investor` — `mine` (Kardex) nunca lo manda,
   * ver `InvestmentController.listMine`. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  propertyId?: string;

  /** Coincidencia parcial en `description` (ver
   * `InvestmentRepositoryAdapter.findByInvestor`). */
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
