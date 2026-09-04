import {
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePropertyRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
