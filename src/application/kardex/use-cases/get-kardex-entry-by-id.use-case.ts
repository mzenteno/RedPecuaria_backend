import { Inject, Injectable } from '@nestjs/common';
import { KardexEntry } from '@domain/kardex/entities/kardex-entry';
import {
  KARDEX_ENTRY_REPOSITORY,
  type KardexEntryRepository,
} from '@domain/kardex/repositories/kardex-entry.repository';
import { KardexEntryNotFoundException } from '@domain/kardex/exceptions/kardex-entry-not-found.exception';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { assertInvestmentOwnership } from '../assert-investment-ownership';

export interface GetKardexEntryByIdInput {
  entryId: string;
  companyId: string;
  /** Mismo criterio que `ListKardexEntriesByInvestmentUseCase`: un
   * Inversionista no puede pedir por id un movimiento que no es suyo,
   * aunque conozca el id — el listado ya se lo oculta (ahora siempre
   * acotado a un inversionista, ver `assertKardexInvestor`), esto es la
   * misma regla para cuando se pide una fila puntual. */
  viewerIsInvestor: boolean;
  viewerUserId: string;
}

/**
 * El detalle completo de un movimiento (con `total`, que el listado a
 * propósito NO trae — ver `KardexEntryListItemResponseDto`) — para quien
 * necesite más, como el diálogo de edición del frontend
 * (`KardexEntryDialog`). Mismo criterio que `GetInvestmentByIdUseCase`/
 * `GetUserByIdUseCase`: nunca se resuelve cruzando datos del listado, se
 * pide el registro completo por id.
 */
@Injectable()
export class GetKardexEntryByIdUseCase {
  constructor(
    @Inject(KARDEX_ENTRY_REPOSITORY)
    private readonly kardexEntryRepository: KardexEntryRepository,
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: GetKardexEntryByIdInput): Promise<KardexEntry> {
    const entry = await this.kardexEntryRepository.findById(input.entryId);
    if (!entry) {
      throw new KardexEntryNotFoundException(input.entryId);
    }

    await assertInvestmentOwnership(entry.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    if (
      input.viewerIsInvestor &&
      entry.fields.investorUserId !== input.viewerUserId
    ) {
      // 404 genérico, no "sin permiso" — mismo criterio que
      // `assertInvestmentOwnership`: no confirma que el movimiento exista.
      throw new KardexEntryNotFoundException(input.entryId);
    }

    return entry;
  }
}
