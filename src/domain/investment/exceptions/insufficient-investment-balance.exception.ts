import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Se lanza si un movimiento de kardex (baja/venta) dejaría el saldo de
 * cabezas o kilos de la inversión en negativo — no se puede dar de baja o
 * vender más de lo que hay en existencia. */
export class InsufficientInvestmentBalanceException extends DomainException {
  constructor(investmentId: string) {
    super(
      `La inversión ${investmentId} no tiene saldo suficiente para este movimiento`,
      DomainExceptionCode.VALIDATION,
    );
  }
}
