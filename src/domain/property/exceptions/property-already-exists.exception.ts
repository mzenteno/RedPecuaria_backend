import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class PropertyAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(
      `Ya existe una propiedad llamada "${name}" en esta empresa`,
      DomainExceptionCode.CONFLICT,
    );
  }
}
