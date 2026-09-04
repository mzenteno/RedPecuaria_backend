import type { InvestmentRepository } from '@domain/investment/repositories/investment.repository';
import type { PropertyRepository } from '@domain/property/repositories/property.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';

/**
 * Una `Investment` no tiene `companyId` propio (llega a través de su
 * `Property`) — este chequeo recorre esa cadena para confirmar que la
 * inversión sea de la empresa activa antes de leer/escribir su kardex.
 * Mismo criterio que el resto del proyecto: 404 genérico, no confirma que
 * la inversión exista en otra empresa.
 */
export async function assertInvestmentOwnership(
  investmentId: string,
  companyId: string,
  repos: {
    investmentRepository: InvestmentRepository;
    propertyRepository: PropertyRepository;
  },
): Promise<void> {
  const investment = await repos.investmentRepository.findById(investmentId);
  if (!investment) {
    throw new InvestmentNotFoundException(investmentId);
  }

  const property = await repos.propertyRepository.findById(
    investment.propertyId,
  );
  if (!property || property.companyId !== companyId) {
    throw new InvestmentNotFoundException(investmentId);
  }
}
