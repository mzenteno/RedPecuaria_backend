import type { Investment } from '@domain/investment/entities/investment';
import type { InvestmentRepository } from '@domain/investment/repositories/investment.repository';
import type { TransactionContext } from '@domain/core/ports/transaction-manager.port';

/**
 * Recalcula y guarda `Investment.isFinished` (derivado: terminada = TODOS
 * sus inversionistas terminados, ver `InvestmentInvestor.isFinished`).
 * Se llama en la misma transacción de cualquier cambio que lo pueda
 * alterar: finalizar/reactivar a un inversionista
 * (`SetKardexInvestorFinishedUseCase`) o cambiar la lista de inversionistas
 * (`UpdateInvestmentUseCase` — sumar uno nuevo reabre una inversión
 * terminada; sacar al único que seguía activo la termina).
 */
export async function syncInvestmentFinished(
  investment: Investment,
  investmentRepository: InvestmentRepository,
  ctx: TransactionContext,
): Promise<Investment> {
  const investors = await investmentRepository.findInvestmentInvestors(
    investment.id,
    ctx,
  );
  investment.syncFinished(
    investors.length > 0 && investors.every((investor) => investor.isFinished),
  );
  return investmentRepository.save(investment, ctx);
}
