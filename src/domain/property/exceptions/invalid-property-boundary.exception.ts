import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Ver `Property.assertValidBoundary` — un contorno necesita al menos 3
 * vértices para encerrar una superficie. */
export class InvalidPropertyBoundaryException extends DomainException {
  constructor() {
    super(
      'El contorno de la propiedad necesita al menos 3 puntos',
      DomainExceptionCode.VALIDATION,
    );
  }
}
