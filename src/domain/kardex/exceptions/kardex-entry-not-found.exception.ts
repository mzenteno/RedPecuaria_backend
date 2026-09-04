import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class KardexEntryNotFoundException extends DomainException {
  constructor(entryId: string) {
    super(
      `No se encontró el movimiento de kardex ${entryId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
