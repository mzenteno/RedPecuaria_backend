import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListUsersQueryDto {
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

  /** Filtra por coincidencia parcial en `username`, `email` o `fullName` (ver
   * `UserRepositoryAdapter.findAllPaginated`) — se resuelve en el servidor
   * porque el listado también lo está (a diferencia de "Empresas"). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
