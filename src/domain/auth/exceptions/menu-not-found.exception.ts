import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export class MenuNotFoundException extends DomainException {
  constructor(menuId: string) {
    super(`No se encontró el menú ${menuId}`, DomainExceptionCode.NOT_FOUND);
  }
}
