import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const MY_INVESTMENTS_STATUSES = ['active', 'finished'] as const;
export type MyInvestmentsStatus = (typeof MY_INVESTMENTS_STATUSES)[number];

export class ListMyInvestmentsQueryDto {
  /** Pestañas "Activas"/"Terminadas" de "Mis inversiones" (Kardex) — un
   * string en vez de un booleano porque un `isFinished=false` en el query
   * string llega como texto y `@Type(() => Boolean)` lo convertiría en
   * `true`. Sin él, trae ambos estados. */
  @IsOptional()
  @IsIn(MY_INVESTMENTS_STATUSES)
  status?: MyInvestmentsStatus;

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
