import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

export interface CompanyChoice {
  companyId: string;
  companyName: string;
}

/**
 * El usuario tiene más de una empresa activa (`UserCompany`) y no indicó con
 * cuál iniciar sesión — no se emite ningún token hasta que se resuelva
 * (ver docs/auth-sessions/auth-sessions.md). `choices` viaja en la excepción
 * para que el filtro HTTP se lo pueda devolver al cliente y arme el selector.
 */
export class CompanySelectionRequiredException extends DomainException {
  constructor(public readonly choices: CompanyChoice[]) {
    super(
      'El usuario tiene más de una empresa activa, debe indicar con cuál iniciar sesión',
      DomainExceptionCode.VALIDATION,
      { choices },
    );
  }
}
