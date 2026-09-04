import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class UserTypeNotFoundException extends DomainException {
  constructor(userTypeId: string) {
    super(
      `No se encontró el tipo de usuario ${userTypeId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
