import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class PropertyNotFoundException extends DomainException {
  constructor(propertyId: string) {
    super(
      `No se encontró la propiedad ${propertyId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
