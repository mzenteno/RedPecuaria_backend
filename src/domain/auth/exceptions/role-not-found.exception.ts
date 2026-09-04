import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class RoleNotFoundException extends DomainException {
  constructor(roleId: string) {
    super(`No se encontró el rol ${roleId}`, DomainExceptionCode.NOT_FOUND);
  }
}
