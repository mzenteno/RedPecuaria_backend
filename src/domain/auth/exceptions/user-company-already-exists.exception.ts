import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class UserCompanyAlreadyExistsException extends DomainException {
  constructor() {
    super(
      'El usuario ya pertenece a esta empresa',
      DomainExceptionCode.CONFLICT,
    );
  }
}
