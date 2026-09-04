import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvalidUsernameException extends DomainException {
  constructor() {
    super(
      'El nombre de usuario no puede estar vacío',
      DomainExceptionCode.VALIDATION,
    );
  }
}
