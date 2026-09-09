import { Inject, Injectable } from '@nestjs/common';
import {
  KardexEntry,
  KardexEntryFields,
} from '@domain/kardex/entities/kardex-entry';
import {
  KARDEX_ENTRY_REPOSITORY,
  type KardexEntryRepository,
} from '@domain/kardex/repositories/kardex-entry.repository';
import { KardexEntryNotFoundException } from '@domain/kardex/exceptions/kardex-entry-not-found.exception';
import {
  MOVEMENT_TYPE_REPOSITORY,
  type MovementTypeRepository,
} from '@domain/kardex/repositories/movement-type.repository';
import { MovementType } from '@domain/kardex/entities/movement-type';
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
import { assertKardexInvestor } from '../assert-kardex-investor';
import { computeMovementDelta } from '../compute-movement-delta';

export interface UpdateKardexEntryInput extends KardexEntryFields {
  entryId: string;
  companyId: string;
}

@Injectable()
export class UpdateKardexEntryUseCase {
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

  async execute(input: UpdateKardexEntryInput): Promise<KardexEntry> {
    const entry = await this.kardexEntryRepository.findById(input.entryId);
    if (!entry) {
      throw new KardexEntryNotFoundException(input.entryId);
    }

    await assertInvestmentOwnership(entry.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    const [oldMovementType, newMovementType] = await Promise.all([
      this.resolveMovementType(entry.fields.movementTypeId),
      this.resolveMovementType(input.movementTypeId),
    ]);

    await assertKardexInvestor(
      newMovementType,
      input.investorUserId,
      entry.investmentId,
      this.investmentRepository,
    );

    const newFields: KardexEntryFields = {
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
    };
    // Efecto neto sobre el saldo: se revierte lo que este movimiento venía
    // aportando con sus valores viejos y se aplica lo que aporta con los
    // nuevos, en un solo delta — así un estado intermedio que nunca existió
    // de verdad (ej. quitar el ingreso viejo antes de sumar el nuevo) no
    // puede rechazar la edición por "saldo insuficiente" de forma espuria.
    const oldDelta = computeMovementDelta({
      movementType: oldMovementType,
      entryQuantity: entry.fields.entryQuantity,
      entryKilos: entry.fields.entryKilos,
      exitQuantity: entry.fields.exitQuantity,
      exitKilos: entry.fields.exitKilos,
      total: entry.fields.total,
    });
    const newDelta = computeMovementDelta({
      movementType: newMovementType,
      entryQuantity: newFields.entryQuantity,
      entryKilos: newFields.entryKilos,
      exitQuantity: newFields.exitQuantity,
      exitKilos: newFields.exitKilos,
      total: newFields.total,
    });
    const netDelta = {
      quantity: newDelta.quantity - oldDelta.quantity,
      kilos: newDelta.kilos - oldDelta.kilos,
      total: newDelta.total - oldDelta.total,
    };

    return this.transactionManager.run(async (ctx) => {
      const investment = await this.investmentRepository.findById(
        entry.investmentId,
        ctx,
      );
      if (!investment) {
        throw new InvestmentNotFoundException(entry.investmentId);
      }

      investment.applyBalanceDelta(netDelta);
      await this.investmentRepository.save(investment, ctx);

      entry.update(newFields);
      return this.kardexEntryRepository.save(entry, ctx);
    });
  }

  private async resolveMovementType(id: string): Promise<MovementType> {
    const movementType = await this.movementTypeRepository.findById(id);
    if (!movementType) {
      throw new MovementTypeNotFoundException(id);
    }
    return movementType;
  }
}
