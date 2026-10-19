import type { InvestmentRepository } from '@domain/investment/repositories/investment.repository';
import { InvalidKardexInvestorException } from '@domain/kardex/exceptions/invalid-kardex-investor.exception';

/**
 * Reglas compartidas por `CreateKardexEntryUseCase`/`UpdateKardexEntryUseCase`:
 * TODO movimiento (ingreso/baja/venta) tiene un inversionista — a quién se
 * le atribuye, de la lista de inversionistas ya registrados en la inversión
 * (ver `InvestmentRepository.findInvestorIds`). A pedido del usuario,
 * 2026-10-14: antes "ingreso"/"baja" eran generales de la inversión, sin
 * inversionista — eso cambió para que el Kardex se pueda ver y saldar por
 * inversionista (ver `InvestmentInvestor`). Los movimientos viejos creados
 * bajo la regla anterior (`investorUserId: null`) no se migran — quedan
 * como "generales" en el historial, ver docs/investment/investment.md.
 */
export async function assertKardexInvestor(
  investorUserId: string | null,
  investmentId: string,
  investmentRepository: InvestmentRepository,
): Promise<void> {
  if (investorUserId === null) {
    throw new InvalidKardexInvestorException(
      'Todo movimiento de kardex necesita un inversionista',
    );
  }

  const investorIds = await investmentRepository.findInvestorIds(investmentId);
  if (!investorIds.includes(investorUserId)) {
    throw new InvalidKardexInvestorException(
      `El usuario ${investorUserId} no es un inversionista de esta inversión`,
    );
  }
}
