import { Inject, Injectable } from '@nestjs/common';
import {
  KARDEX_ENTRY_REPOSITORY,
  type KardexEntryRepository,
} from '@domain/kardex/repositories/kardex-entry.repository';
import { KardexEntryNotFoundException } from '@domain/kardex/exceptions/kardex-entry-not-found.exception';
import {
  MOVEMENT_TYPE_REPOSITORY,
  type MovementTypeRepository,
} from '@domain/kardex/repositories/movement-type.repository';
import { MovementTypeNotFoundException } from '@domain/kardex/exceptions/movement-type-not-found.exception';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '@domain/core/ports/transaction-manager.port';
import { assertInvestmentOwnership } from '../assert-investment-ownership';
import { computeMovementDelta, negateDelta } from '../compute-movement-delta';

export interface DeactivateKardexEntryInput {
  entryId: string;
  companyId: string;
}

/** Al desactivar un movimiento hay que revertir su efecto sobre el saldo
 * vigente de la inversión (ahora vive en `Investment`, ya no es una foto
 * por fila) — en la misma transacción, mismo criterio que Create/Update. */
@Injectable()
export class DeactivateKardexEntryUseCase {
  constructor(
    @Inject(KARDEX_ENTRY_REPOSITORY)
    private readonly kardexEntryRepository: KardexEntryRepository,
    @Inject(MOVEMENT_TYPE_REPOSITORY)
    private readonly movementTypeRepository: MovementTypeRepository,
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: DeactivateKardexEntryInput): Promise<void> {
    const entry = await this.kardexEntryRepository.findById(input.entryId);
    if (!entry) {
      throw new KardexEntryNotFoundException(input.entryId);
    }

    await assertInvestmentOwnership(entry.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    const movementType = await this.movementTypeRepository.findById(
      entry.fields.movementTypeId,
    );
    if (!movementType) {
      throw new MovementTypeNotFoundException(entry.fields.movementTypeId);
    }

    const reverseDelta = negateDelta(
      computeMovementDelta({
        movementType,
        entryQuantity: entry.fields.entryQuantity,
        entryKilos: entry.fields.entryKilos,
        exitQuantity: entry.fields.exitQuantity,
        exitKilos: entry.fields.exitKilos,
        total: entry.fields.total,
      }),
    );

    await this.transactionManager.run(async (ctx) => {
      const investment = await this.investmentRepository.findById(
        entry.investmentId,
        ctx,
      );
      if (!investment) {
        throw new InvestmentNotFoundException(entry.investmentId);
      }

      investment.applyBalanceDelta(reverseDelta);
      await this.investmentRepository.save(investment, ctx);

      entry.deactivate();
      await this.kardexEntryRepository.save(entry, ctx);
    });
  }
}
