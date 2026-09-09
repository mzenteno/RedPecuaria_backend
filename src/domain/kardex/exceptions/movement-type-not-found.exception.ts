import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class MovementTypeNotFoundException extends DomainException {
  constructor(movementTypeId: string) {
    super(
      `No se encontró el tipo de movimiento ${movementTypeId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
