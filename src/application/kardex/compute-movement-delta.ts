import type { MovementType } from '@domain/kardex/entities/movement-type';
import type { InvestmentBalanceDelta } from '@domain/investment/entities/investment';

/**
 * Traduce un movimiento de kardex al delta que hay que aplicarle al saldo
 * de la `Investment` (ver `Investment.applyBalanceDelta`). Vive acá (no en
 * `Investment`) porque `Investment` no conoce `MovementType` — es un
 * detalle del módulo de Kardex, no una regla propia de la inversión.
 *
 * Recibe el `MovementType` ya resuelto (`MovementTypeRepository.findById`),
 * no un id ni un string — igual criterio que `assertKardexInvestor`.
 *
 * - Ingreso: suma cantidad y kilos que entraron; suma su `total` (dato que
 *   tipeó el usuario).
 * - Baja: solo resta cantidad — no toca kilos (una baja no pide kilos como
 *   input) ni total (no tiene).
 * - Venta: resta cantidad y kilos que salieron; suma su `total`.
 */
export function computeMovementDelta(fields: {
  movementType: MovementType;
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  total: number;
}): InvestmentBalanceDelta {
  if (fields.movementType.isIngreso()) {
    return {
      quantity: fields.entryQuantity,
      kilos: fields.entryKilos,
      total: fields.total,
    };
  }
  if (fields.movementType.isBaja()) {
    return { quantity: -fields.exitQuantity, kilos: 0, total: 0 };
  }
  // Venta.
  return {
    quantity: -fields.exitQuantity,
    kilos: -fields.exitKilos,
    total: fields.total,
  };
}

/** Delta inverso — usado al editar (revertir el viejo antes de aplicar el
 * nuevo) y al dar de baja/desactivar un movimiento (revertir su efecto por
 * completo). */
export function negateDelta(
  delta: InvestmentBalanceDelta,
): InvestmentBalanceDelta {
  return {
    quantity: -delta.quantity,
    kilos: -delta.kilos,
    total: -delta.total,
  };
}
