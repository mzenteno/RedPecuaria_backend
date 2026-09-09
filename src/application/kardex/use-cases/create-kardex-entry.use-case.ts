import { Inject, Injectable } from '@nestjs/common';
import {
  KardexEntry,
  KardexEntryFields,
} from '@domain/kardex/entities/kardex-entry';
import {
  KARDEX_ENTRY_REPOSITORY,
  type KardexEntryRepository,
} from '@domain/kardex/repositories/kardex-entry.repository';
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
import { FirstKardexEntryMustBeIngresoException } from '@domain/kardex/exceptions/first-kardex-entry-must-be-ingreso.exception';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '@domain/core/ports/transaction-manager.port';
import { assertInvestmentOwnership } from '../assert-investment-ownership';
import { assertKardexInvestor } from '../assert-kardex-investor';
import { computeMovementDelta } from '../compute-movement-delta';

export interface CreateKardexEntryInput extends KardexEntryFields {
  investmentId: string;
  companyId: string;
}

/**
 * Crea el movimiento de kardex y actualiza el saldo vigente de la
 * `Investment` en la misma transacción (cabecera + detalle no pueden
 * quedar inconsistentes, ver ARCHITECTURE.md §7 — mismo criterio que
 * `CreateInvestmentUseCase`).
 */
@Injectable()
export class CreateKardexEntryUseCase {
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

  async execute(input: CreateKardexEntryInput): Promise<KardexEntry> {
    await assertInvestmentOwnership(input.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    const movementType = await this.movementTypeRepository.findById(
      input.movementTypeId,
    );
    if (!movementType) {
      throw new MovementTypeNotFoundException(input.movementTypeId);
    }

    await assertKardexInvestor(
      movementType,
      input.investorUserId,
      input.investmentId,
      this.investmentRepository,
    );

    // No puede haber una Baja o Venta sin stock previo — la primera
    // transacción de una inversión siempre es Ingreso.
    const hasAnyEntry = await this.kardexEntryRepository.hasAnyActiveEntry(
      input.investmentId,
    );
    if (!hasAnyEntry && !movementType.isIngreso()) {
      throw new FirstKardexEntryMustBeIngresoException(input.investmentId);
    }

    return this.transactionManager.run(async (ctx) => {
      const investment = await this.investmentRepository.findById(
        input.investmentId,
        ctx,
      );
      if (!investment) {
        throw new InvestmentNotFoundException(input.investmentId);
      }

      const entry = KardexEntry.create({
        investmentId: input.investmentId,
        fields: {
          entryDate: input.entryDate,
          detail: input.detail,
          movementTypeId: input.movementTypeId,
          investorUserId: input.investorUserId,
          avgWeight: input.avgWeight,
          entryQuantity: input.entryQuantity,
          entryKilos: input.entryKilos,
          exitQuantity: input.exitQuantity,
          exitKilos: input.exitKilos,
          total: input.total,
        },
      });
      const saved = await this.kardexEntryRepository.save(entry, ctx);

      investment.applyBalanceDelta(
        computeMovementDelta({
          movementType,
          entryQuantity: input.entryQuantity,
          entryKilos: input.entryKilos,
          exitQuantity: input.exitQuantity,
          exitKilos: input.exitKilos,
          total: input.total,
        }),
      );
      await this.investmentRepository.save(investment, ctx);

      return saved;
    });
  }
}
