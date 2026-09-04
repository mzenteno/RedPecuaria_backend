import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class RoleAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(
      `Ya existe un rol llamado "${name}" en esta empresa`,
      DomainExceptionCode.CONFLICT,
    );
  }
}
