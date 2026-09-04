import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/**
 * Mensaje deliberadamente genérico: no distingue si falló el email o el
 * password, para no darle a un atacante información sobre qué emails están
 * registrados en el sistema.
 */
export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Email o contraseña incorrectos', DomainExceptionCode.UNAUTHORIZED);
  }
}
