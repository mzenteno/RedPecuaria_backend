import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  IsOptional,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GeoPointRequestDto } from './geo-point.request.dto';

export class UpdatePropertyRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  /** Contorno de la propiedad (ver `Property.boundary`). Opcional: ausente
   * = no se toca (mobile todavía no lo edita), `null` = se borra. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => GeoPointRequestDto)
  boundary?: GeoPointRequestDto[] | null;
}
