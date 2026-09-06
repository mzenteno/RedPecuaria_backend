import type { InvestmentRepository } from '@domain/investment/repositories/investment.repository';
import type { KardexMovementType } from '@domain/kardex/entities/kardex-entry';
import { InvalidKardexInvestorException } from '@domain/kardex/exceptions/invalid-kardex-investor.exception';

/**
 * Reglas compartidas por `CreateKardexEntryUseCase`/`UpdateKardexEntryUseCase`:
 * solo un movimiento de tipo "venta" tiene inversionista — a quién se le
 * atribuye esa venta puntual, de la lista de inversionistas ya registrados
 * en la inversión (ver `InvestmentRepository.findInvestorIds`). "ingreso" y
 * "baja" son generales para toda la inversión, sin inversionista particular
 * — ver docs/investment/investment.md.
 */
export async function assertKardexInvestor(
  movementType: KardexMovementType,
  investorUserId: string | null,
  investmentId: string,
  investmentRepository: InvestmentRepository,
): Promise<void> {
  if (movementType !== 'venta') {
    if (investorUserId !== null) {
      throw new InvalidKardexInvestorException(
        `Un movimiento de tipo "${movementType}" no debe tener un inversionista asociado`,
      );
    }
    return;
  }

  if (investorUserId === null) {
    throw new InvalidKardexInvestorException(
      'Un movimiento de tipo "venta" necesita un inversionista',
    );
  }

  const investorIds = await investmentRepository.findInvestorIds(investmentId);
  if (!investorIds.includes(investorUserId)) {
    throw new InvalidKardexInvestorException(
      `El usuario ${investorUserId} no es un inversionista de esta inversión`,
    );
  }
}
