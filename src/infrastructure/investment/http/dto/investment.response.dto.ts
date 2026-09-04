export class InvestmentResponseDto {
  id: string;
  propertyId: string;
  gestion: number;
  description: string;
  isDeleted: boolean;
  createdAt: Date;
  investorIds: string[];
}
