import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvestmentTypeNotFoundException extends DomainException {
  constructor(investmentTypeId: string) {
    super(
      `No se encontró el tipo de inversión ${investmentTypeId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
