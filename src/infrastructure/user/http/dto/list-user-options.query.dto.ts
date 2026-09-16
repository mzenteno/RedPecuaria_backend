import { IsOptional, IsString, MinLength } from 'class-validator';

export class ListUserOptionsQueryDto {
  /** Sin esto, todos los usuarios activos de la empresa. Con esto, solo los
   * de ese tipo (ver `UserRepositoryAdapter.findOptions`). */
  @IsOptional()
  @IsString()
  @MinLength(1)
  userTypeId?: string;
}
