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
  INVESTMENT_TYPE_REPOSITORY,
  type InvestmentTypeRepository,
} from '@domain/investment/repositories/investment-type.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';
import { InvestmentTypeNotFoundException } from '@domain/investment/exceptions/investment-type-not-found.exception';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '@domain/core/ports/transaction-manager.port';
import { InvestmentInvestorNotFoundException } from '@domain/investment/exceptions/investment-investor-not-found.exception';
import { assertInvestmentOwnership } from '../assert-investment-ownership';
import { assertKardexInvestor } from '../assert-kardex-investor';
import { computeMovementDelta, negateDelta } from '../compute-movement-delta';

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
    @Inject(INVESTMENT_TYPE_REPOSITORY)
    private readonly investmentTypeRepository: InvestmentTypeRepository,
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

    // El tipo de inversión es fijo (no se edita) — resolverlo acá, antes de
    // armar los deltas, alcanza (no hace falta releerlo adentro de la
    // transacción como a `investment` mismo).
    const investmentForType = await this.investmentRepository.findById(
      entry.investmentId,
    );
    if (!investmentForType) {
      throw new InvestmentNotFoundException(entry.investmentId);
    }
    const investmentType = await this.investmentTypeRepository.findById(
      investmentForType.investmentTypeId,
    );
    if (!investmentType) {
      throw new InvestmentTypeNotFoundException(
        investmentForType.investmentTypeId,
      );
    }

    const [oldMovementType, newMovementType] = await Promise.all([
      this.resolveMovementType(entry.fields.movementTypeId),
      this.resolveMovementType(input.movementTypeId),
    ]);

    await assertKardexInvestor(
      input.investorUserId,
      entry.investmentId,
      this.investmentRepository,
    );
    // `assertKardexInvestor` ya garantiza que no es null acá.
    const newInvestorUserId = input.investorUserId as string;
    // El investorUserId VIEJO puede ser `null` si es un movimiento histórico
    // (creado antes de 2026-10-14, cuando "ingreso"/"baja" eran generales,
    // sin inversionista — ver `assertKardexInvestor`) — en ese caso su
    // delta viejo nunca se aplicó a ningún `InvestmentInvestor`, así que no
    // hay nada que revertirle a nadie, solo aplicar el nuevo.
    const oldInvestorUserId = entry.fields.investorUserId;

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
      investmentType,
      avgWeight: entry.fields.avgWeight,
      entryQuantity: entry.fields.entryQuantity,
      entryKilos: entry.fields.entryKilos,
      exitQuantity: entry.fields.exitQuantity,
      exitKilos: entry.fields.exitKilos,
      total: entry.fields.total,
    });
    const newDelta = computeMovementDelta({
      movementType: newMovementType,
      investmentType,
      avgWeight: newFields.avgWeight,
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

      // `Investment.balance*` sigue siendo el agregado total — un cambio de
      // inversionista entre viejo y nuevo no le afecta, el neto es el
      // mismo. Las filas de `InvestmentInvestor` sí pueden ser DOS
      // distintas si `oldInvestorUserId !== newInvestorUserId` — se revierte
      // el delta viejo de quien lo tenía (si tenía, ver el comentario de
      // `oldInvestorUserId` arriba) y se aplica el nuevo a quien corresponda
      // ahora, en vez de un solo `netDelta` (que solo tendría sentido si
      // fuera siempre la misma fila).
      investment.applyBalanceDelta(netDelta);
      await this.investmentRepository.save(investment, ctx);

      if (oldInvestorUserId !== null) {
        const oldInvestor =
          await this.investmentRepository.findInvestmentInvestor(
            entry.investmentId,
            oldInvestorUserId,
            ctx,
          );
        if (!oldInvestor) {
          throw new InvestmentInvestorNotFoundException(
            entry.investmentId,
            oldInvestorUserId,
          );
        }
        oldInvestor.applyBalanceDelta(negateDelta(oldDelta));
        await this.investmentRepository.saveInvestmentInvestor(
          oldInvestor,
          ctx,
        );
      }

      const newInvestor =
        await this.investmentRepository.findInvestmentInvestor(
          entry.investmentId,
          newInvestorUserId,
          ctx,
        );
      if (!newInvestor) {
        throw new InvestmentInvestorNotFoundException(
          entry.investmentId,
          newInvestorUserId,
        );
      }
      newInvestor.applyBalanceDelta(newDelta);
      await this.investmentRepository.saveInvestmentInvestor(newInvestor, ctx);

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
