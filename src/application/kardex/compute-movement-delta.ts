import type { MovementType } from '@domain/kardex/entities/movement-type';
import type { InvestmentType } from '@domain/investment/entities/investment-type';
import type { InvestmentBalanceDelta } from '@domain/investment/entities/investment';

/**
 * Traduce un movimiento de kardex al delta que hay que aplicarle al saldo
 * de la `Investment` (ver `Investment.applyBalanceDelta`). Vive acá (no en
 * `Investment`) porque `Investment` no conoce `MovementType` — es un
 * detalle del módulo de Kardex, no una regla propia de la inversión.
 *
 * Recibe el `MovementType` y el `InvestmentType` ya resueltos (nunca un id
 * ni un string) — igual criterio que `assertKardexInvestor`.
 *
 * En modo "kilo" (el original): Ingreso suma cantidad y kilos que
 * entraron, suma su `total` (dato que tipeó el usuario, sin relación
 * calculada con los kilos — es el acumulado usado para Debe/Haber, ver
 * `KardexEntryMapper`). Venta resta cantidad y kilos que salieron, suma su
 * `total`. Baja (a pedido del usuario, 2026-09-24, corregido 2026-09-24)
 * resta cantidad Y resta kilos — el valor de kilos sale del campo
 * `avgWeight`, reusado acá como "Salida — kilos" (mismo título/criterio
 * que Venta, ver `KardexEntryDialog`; NO es un promedio para Baja, es el
 * valor directo, sin multiplicar por `exitQuantity` — a diferencia de un
 * primer intento que sí multiplicaba, corregido porque el título "Salida
 * — kilos" implica el total, no un promedio por cabeza).
 *
 * En modo "dinero": mismo criterio exacto, pero `total` pasa a jugar el
 * papel que kilos juega en modo "kilo" (el saldo físico secundario, ver
 * `Investment.applyBalanceDelta`) — Ingreso lo suma, Venta lo RESTA (al
 * revés que en modo "kilo", donde Venta siempre suma su `total`). Baja en
 * este modo también resta, pero del mismo `avgWeight` (reusado acá como
 * "Total Bs.", igual título que usa Venta) — DELIBERADAMENTE no del campo
 * `total`: si Baja usara `total` acá, `KardexEntryMapper` empezaría a
 * contarla como "Haber" (dinero recuperado) en el footer Debe/Haber, y una
 * baja es una PÉRDIDA, no una recuperación — `total` de Baja se mantiene
 * siempre en 0, como siempre. `kilos`/`entryKilos`/`exitKilos` en modo
 * dinero siempre vienen en 0 desde el formulario (no se piden), así que no
 * hace falta un caso aparte para esos campos.
 */
export function computeMovementDelta(fields: {
  movementType: MovementType;
  investmentType: InvestmentType;
  avgWeight: number;
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
    return {
      quantity: -fields.exitQuantity,
      kilos: fields.investmentType.isDinero() ? 0 : -fields.avgWeight,
      total: fields.investmentType.isDinero() ? -fields.avgWeight : 0,
    };
  }
  // Venta.
  return {
    quantity: -fields.exitQuantity,
    kilos: -fields.exitKilos,
    total: fields.investmentType.isDinero() ? -fields.total : fields.total,
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
