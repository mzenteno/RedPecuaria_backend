import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Todo usuario que NO sea Super Administrador necesita un rol dentro de una
 * empresa concreta al darse de alta (ver `RegisterUserUseCase`) — un Super
 * Administrador es la única excepción (no pertenece a ninguna empresa
 * puntual, ver docs/user-company/changes/2026-09-25-super-admin-sin-user-
 * company.md). */
export class RoleRequiredException extends DomainException {
  constructor() {
    super(
      'El rol es obligatorio para este tipo de usuario',
      DomainExceptionCode.VALIDATION,
    );
  }
}
