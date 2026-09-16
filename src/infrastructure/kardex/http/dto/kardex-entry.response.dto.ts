export class KardexEntryResponseDto {
  id: string;
  investmentId: string;
  entryDate: string;
  detail: string;
  movementTypeId: string;
  investorUserId: string | null;
  avgWeight: number;
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  total: number;
  createdAt: Date;
}
