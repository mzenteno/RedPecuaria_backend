import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Se lanza si el `investorUserId` de un movimiento de kardex no cumple la
 * regla de `assertKardexInvestor`: obligatorio y de la lista de
 * inversionistas de la inversión si `movementType === 'venta'`, ausente en
 * cualquier otro caso. */
export class InvalidKardexInvestorException extends DomainException {
  constructor(message: string) {
    super(message, DomainExceptionCode.VALIDATION);
  }
}
