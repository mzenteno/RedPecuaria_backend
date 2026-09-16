import { KardexEntry } from '@domain/kardex/entities/kardex-entry';
import { KardexEntryWithRunningBalance } from '@domain/kardex/repositories/kardex-entry.repository';
import { KardexEntryResponseDto } from './dto/kardex-entry.response.dto';
import { KardexEntryListItemResponseDto } from './dto/kardex-entry-list-item.response.dto';

export class KardexEntryMapper {
  static toResponse(entry: KardexEntry): KardexEntryResponseDto {
    return {
      id: entry.id,
      investmentId: entry.investmentId,
      ...entry.fields,
      createdAt: entry.createdAt,
    };
  }

  static toListResponse(
    item: KardexEntryWithRunningBalance,
  ): KardexEntryListItemResponseDto {
    const {
      entry,
      runningBalanceQuantity,
      runningBalanceKilos,
      movementTypeName,
      investorName,
    } = item;
    // Ingreso es "Debe" (dinero que entra), Venta/Baja son "Haber" (dinero
    // que sale/se recupera) — Baja nunca tiene `total` (siempre 0, ver
    // `KardexEntry`), así que su "Haber" da 0 sin caso especial.
    const isIngreso = movementTypeName === 'ingreso';
    return {
      id: entry.id,
      entryDate: entry.fields.entryDate,
      detail: entry.fields.detail,
      movementTypeName,
      investorName,
      avgWeight: entry.fields.avgWeight,
      entryQuantity: entry.fields.entryQuantity,
      entryKilos: entry.fields.entryKilos,
      exitQuantity: entry.fields.exitQuantity,
      exitKilos: entry.fields.exitKilos,
      runningBalanceQuantity,
      runningBalanceKilos,
      debe: isIngreso ? entry.fields.total : 0,
      haber: isIngreso ? 0 : entry.fields.total,
    };
  }
}
