import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class SuperAdminRequiredException extends DomainException {
  constructor() {
    super(
      'Solo un Super Administrador puede cambiar de empresa activa',
      DomainExceptionCode.FORBIDDEN,
    );
  }
}
