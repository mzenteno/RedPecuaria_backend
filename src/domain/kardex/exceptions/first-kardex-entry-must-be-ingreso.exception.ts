import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Se lanza al intentar crear el primer movimiento de kardex de una
 * inversión con un `movementType` distinto de "ingreso" — no puede haber
 * una Baja o una Venta sin stock previo. */
export class FirstKardexEntryMustBeIngresoException extends DomainException {
  constructor(investmentId: string) {
    super(
      `El primer movimiento de kardex de la inversión ${investmentId} tiene que ser de tipo "ingreso"`,
      DomainExceptionCode.VALIDATION,
    );
  }
}
