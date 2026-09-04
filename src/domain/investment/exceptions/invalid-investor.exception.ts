import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Se lanza si un `userId` propuesto como inversionista no existe, no es de
 * tipo Inversionista, o no pertenece a la empresa activa. */
export class InvalidInvestorException extends DomainException {
  constructor(userId: string) {
    super(
      `El usuario ${userId} no es un inversionista válido de esta empresa`,
      DomainExceptionCode.VALIDATION,
    );
  }
}
