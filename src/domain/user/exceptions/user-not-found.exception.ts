import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class UserNotFoundException extends DomainException {
  constructor(userId: string) {
    super(`No se encontró el usuario ${userId}`, DomainExceptionCode.NOT_FOUND);
  }
}
