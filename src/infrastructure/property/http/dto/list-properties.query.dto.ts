import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListPropertiesQueryDto {
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

  /** Filtra por coincidencia parcial en `name` (ver
   * `PropertyRepositoryAdapter.findAllPaginated`). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
