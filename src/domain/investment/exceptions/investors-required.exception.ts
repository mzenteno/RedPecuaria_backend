import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class InvestorsRequiredException extends DomainException {
  constructor() {
    super(
      'Una inversión necesita al menos un inversionista',
      DomainExceptionCode.VALIDATION,
    );
  }
}
