import { KardexEntry } from '@domain/kardex/entities/kardex-entry';
import { KardexEntryResponseDto } from './dto/kardex-entry.response.dto';

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
}
