import {
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateKardexEntryRequestDto {
  @IsString()
  @MinLength(1)
  investmentId: string;

  @IsDateString()
  entryDate: string;

  @IsString()
  @MinLength(1)
  detail: string;

  /** FK a `kardex_movement_types` — la existencia se valida en el caso de
   * uso (`MovementTypeRepository.findById`), no acá con un `@IsIn`, mismo
   * criterio que `userTypeId` en `RegisterUserRequestDto`. */
  @IsString()
  @MinLength(1)
  movementTypeId: string;

  /** Obligatorio solo si el tipo de movimiento es "venta" — validado en el
   * caso de uso (`assertKardexInvestor`), no acá (necesita resolver el tipo
   * y consultar la lista de inversionistas de la inversión). */
  @ValidateIf((dto: CreateKardexEntryRequestDto) => dto.investorUserId !== null)
  @IsString()
  @MinLength(1)
  investorUserId: string | null;

  @IsNumber()
  @Min(0)
  avgWeight: number;

  @IsInt()
  @Min(0)
  entryQuantity: number;

  @IsNumber()
  @Min(0)
  entryKilos: number;

  @IsInt()
  @Min(0)
  exitQuantity: number;

  @IsNumber()
  @Min(0)
  exitKilos: number;

  /** Dato que tipea el usuario en Ingreso/Venta (0 en Baja) — el saldo que
   * este movimiento acumula en `Investment.total` lo calcula el caso de uso
   * (`computeMovementDelta`), no llega del cliente. */
  @IsNumber()
  @Min(0)
  total: number;
}
