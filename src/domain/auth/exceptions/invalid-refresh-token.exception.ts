import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvalidRefreshTokenException extends DomainException {
  constructor() {
    super(
      'El refresh token no es válido, expiró o ya fue usado',
      DomainExceptionCode.UNAUTHORIZED,
    );
  }
}
