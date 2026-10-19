import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Igual criterio que `InsufficientInvestmentBalanceException`, pero sobre
 * el saldo de UN inversionista puntual dentro de la inversión (ver
 * `InvestmentInvestor.applyBalanceDelta`) — no se puede dar de baja o vender
 * más cabezas de las que ese inversionista tiene en existencia. */
export class InsufficientInvestorBalanceException extends DomainException {
  constructor(investmentId: string, userId: string) {
    super(
      `El inversionista ${userId} no tiene saldo suficiente para este movimiento en la inversión ${investmentId}`,
      DomainExceptionCode.VALIDATION,
    );
  }
}
