export class KardexEntryResponseDto {
  id: string;
  investmentId: string;
  entryDate: string;
  detail: string;
  avgWeight: number;
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  balanceQuantity: number;
  balanceKilos: number;
  total: number;
  isDeleted: boolean;
  createdAt: Date;
}
