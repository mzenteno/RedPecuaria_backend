import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class UsernameAlreadyRegisteredException extends DomainException {
  constructor(username: string) {
    super(
      `Ya existe un usuario con el nombre de usuario "${username}"`,
      DomainExceptionCode.CONFLICT,
    );
  }
}
