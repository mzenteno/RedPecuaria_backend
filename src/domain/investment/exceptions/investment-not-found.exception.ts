import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvestmentNotFoundException extends DomainException {
  constructor(investmentId: string) {
    super(
      `No se encontró la inversión ${investmentId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
