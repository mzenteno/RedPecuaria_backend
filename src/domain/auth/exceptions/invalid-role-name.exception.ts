import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvalidRoleNameException extends DomainException {
  constructor() {
    super(
      'El nombre del rol no puede estar vacío',
      DomainExceptionCode.VALIDATION,
    );
  }
}
