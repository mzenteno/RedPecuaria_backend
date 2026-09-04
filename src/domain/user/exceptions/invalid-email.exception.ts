import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvalidEmailException extends DomainException {
  constructor(raw: string) {
    super(`"${raw}" no es un email válido`, DomainExceptionCode.VALIDATION);
  }
}
