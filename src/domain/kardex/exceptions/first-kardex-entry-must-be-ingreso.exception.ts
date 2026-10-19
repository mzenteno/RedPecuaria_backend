import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Se lanza al intentar crear el primer movimiento de kardex de UN
 * INVERSIONISTA en una inversión (ver `InvestmentInvestor`) con un
 * `movementType` distinto de "ingreso" — no puede haber una Baja o una
 * Venta sin stock previo propio. */
export class FirstKardexEntryMustBeIngresoException extends DomainException {
  constructor(investmentId: string, userId: string) {
    super(
      `El primer movimiento de kardex del inversionista ${userId} en la inversión ${investmentId} tiene que ser de tipo "ingreso"`,
      DomainExceptionCode.VALIDATION,
    );
  }
}
