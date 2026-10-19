import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

/** Inconsistencia defensiva: `assertKardexInvestor` ya validó que
 * `investorUserId` está en `findInvestorIds(investmentId)`, así que la fila
 * de `InvestmentInvestor` (creada junto con la membresía, ver
 * `InvestmentRepositoryAdapter.replaceInvestors`) debería existir siempre —
 * si no aparece acá es que algo dejó esos dos datos desincronizados. */
export class InvestmentInvestorNotFoundException extends DomainException {
  constructor(investmentId: string, userId: string) {
    super(
      `No se encontró el vínculo del inversionista ${userId} con la inversión ${investmentId}`,
      DomainExceptionCode.NOT_FOUND,
    );
  }
}
