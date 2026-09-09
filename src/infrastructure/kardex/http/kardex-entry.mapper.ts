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
      isDeleted: entry.isDeleted,
      createdAt: entry.createdAt,
    };
  }

  static toListResponse(
    item: KardexEntryWithRunningBalance,
  ): KardexEntryListItemResponseDto {
    return {
      ...this.toResponse(item.entry),
      runningBalanceQuantity: item.runningBalanceQuantity,
      runningBalanceKilos: item.runningBalanceKilos,
    };
  }
}
