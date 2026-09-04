import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class CompanyNotFoundException extends DomainException {
  constructor(companyId: string) {
    super(
      `No se encontró la empresa ${companyId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
