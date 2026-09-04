import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class NoActiveUserCompanyException extends DomainException {
  constructor() {
    super(
      'El usuario no tiene ninguna empresa activa asociada',
      DomainExceptionCode.FORBIDDEN,
    );
  }
}
