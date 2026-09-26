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
      runningBalanceTotal,
      movementTypeName,
      investorName,
      debe,
      haber,
    } = item;
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
      runningBalanceTotal,
      debe,
      haber,
    };
  }
}
