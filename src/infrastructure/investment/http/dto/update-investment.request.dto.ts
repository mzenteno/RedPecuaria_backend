import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MIN_GESTION = 2000;
const MAX_GESTION = 2100;

export class UpdateInvestmentRequestDto {
  @IsString()
  @MinLength(1)
  propertyId: string;

  @IsInt()
  @Min(MIN_GESTION)
  @Max(MAX_GESTION)
  gestion: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  investorUserIds: string[];

  /** Elección manual del usuario (ver `Investment.update`) — no se deriva
   * del saldo, aunque la idea de uso es marcarlo cuando llegue a 0. */
  @IsBoolean()
  isFinished: boolean;
}
