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

export class ListInvestmentsByGestionQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  gestion: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  propertyId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  investorUserId?: string;

  /** Coincidencia parcial en `description` (ver
   * `InvestmentRepositoryAdapter.findActiveByCompanyAndGestion`). */
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
