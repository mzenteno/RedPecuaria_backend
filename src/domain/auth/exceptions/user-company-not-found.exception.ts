import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class UserCompanyNotFoundException extends DomainException {
  constructor(userCompanyId: string) {
    super(
      `No se encontró el vínculo usuario-empresa ${userCompanyId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
