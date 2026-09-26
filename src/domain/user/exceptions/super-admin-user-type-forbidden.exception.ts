import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** A pedido del usuario (2026-09-25): solo un Super Administrador puede
 * crear un usuario de tipo Super Administrador, o ascender a uno existente
 * a ese tipo — ver `RegisterUserUseCase`/`ChangeUserTypeUseCase`. Mismo
 * código (`FORBIDDEN`) que `SuperAdminRequiredException`, pero con mensaje
 * propio (esa otra es específica de "cambiar de empresa activa"). */
export class SuperAdminUserTypeForbiddenException extends DomainException {
  constructor() {
    super(
      'Solo un Super Administrador puede asignar el tipo Super Administrador',
      DomainExceptionCode.FORBIDDEN,
    );
  }
}
