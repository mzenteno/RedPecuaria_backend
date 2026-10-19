import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Se lanza al intentar mover el saldo de un inversionista cuya parte de la
 * inversión ya está terminada (ver `InvestmentInvestor.applyBalanceDelta`) —
 * su Kardex queda de solo lectura hasta que se lo reactive. */
export class InvestorInvestmentFinishedException extends DomainException {
  constructor(investmentId: string, userId: string) {
    super(
      'La inversión de este inversionista está terminada: reactívela para registrar o modificar movimientos',
      DomainExceptionCode.CONFLICT,
      { investmentId, userId },
    );
  }
}
