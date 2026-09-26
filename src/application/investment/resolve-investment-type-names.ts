import type { InvestmentTypeRepository } from '@domain/investment/repositories/investment-type.repository';

/**
 * Mapa `id → name` de TODO el catálogo de tipos de inversión — son solo 2
 * filas (`kilo`/`dinero`), así que traerlas todas de una y reusar el mapa
 * para las N filas de un listado es más barato que un `findById` por fila
 * (mismo criterio que se le aplicó a `propertyName` en
 * `ListInvestmentsByGestionUseCase`: nunca un fetch por fila cuando el
 * catálogo completo es chico y se puede traer una sola vez).
 */
export async function resolveInvestmentTypeNames(
  investmentTypeRepository: InvestmentTypeRepository,
): Promise<Map<string, string>> {
  const investmentTypes = await investmentTypeRepository.findAll();
  return new Map(investmentTypes.map((type) => [type.id, type.name]));
}
