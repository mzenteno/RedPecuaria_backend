import { IsLatitude, IsLongitude } from 'class-validator';

/** Un vértice del contorno de una propiedad (ver `Property.boundary`). */
export class GeoPointRequestDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
