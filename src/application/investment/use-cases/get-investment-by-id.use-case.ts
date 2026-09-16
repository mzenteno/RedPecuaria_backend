import { Inject, Injectable } from '@nestjs/common';
import { Investment } from '@domain/investment/entities/investment';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';

export interface GetInvestmentByIdInput {
  investmentId: string;
  companyId: string;
}

/**
 * El detalle completo de una inversión (con `balanceQuantity`/
 * `balanceKilos`/`total`, que los listados a propósito NO traen — ver
 * `InvestmentListItemResponseDto`) — para quien necesite más, como el
 * diálogo de edición del frontend (`InvestmentDialog`) o el "Saldo actual"
 * de Kardex. Mismo criterio que `GetUserByIdUseCase`: nunca se resuelve
 * cruzando datos del listado, se pide el registro completo por id.
 */
@Injectable()
export class GetInvestmentByIdUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: GetInvestmentByIdInput): Promise<{
    investment: Investment;
    investorIds: string[];
    propertyName: string;
  }> {
    const investment = await this.investmentRepository.findById(
      input.investmentId,
    );
    if (!investment) {
      throw new InvestmentNotFoundException(input.investmentId);
    }

    // Misma validación que `UpdateInvestmentUseCase`: la inversión tiene que
    // ser de una propiedad de la empresa activa, nunca se confía en el id
    // a ciegas. Ya la tenemos acá — se reusa su nombre, no hace falta un
    // segundo fetch (ni que el frontend pida el catálogo de propiedades
    // aparte solo para resolverlo, bug real, ver el change de este cambio).
    const property = await this.propertyRepository.findById(
      investment.propertyId,
    );
    if (!property || property.companyId !== input.companyId) {
      throw new InvestmentNotFoundException(input.investmentId);
    }

    const investorIds = await this.investmentRepository.findInvestorIds(
      investment.id,
    );
    return { investment, investorIds, propertyName: property.name };
  }
}
