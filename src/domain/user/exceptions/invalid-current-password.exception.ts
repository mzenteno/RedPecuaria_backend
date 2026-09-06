import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvalidCurrentPasswordException extends DomainException {
  constructor() {
    super(
      'La contraseña actual no es correcta',
      DomainExceptionCode.UNAUTHORIZED,
    );
  }
}
