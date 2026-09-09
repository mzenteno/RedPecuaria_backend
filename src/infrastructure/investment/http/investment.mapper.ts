import { Investment } from '@domain/investment/entities/investment';
import { InvestmentResponseDto } from './dto/investment.response.dto';

export class InvestmentMapper {
  static toResponse(
    investment: Investment,
    investorIds: string[],
  ): InvestmentResponseDto {
    return {
      id: investment.id,
      propertyId: investment.propertyId,
      gestion: investment.gestion,
      description: investment.description,
      balanceQuantity: investment.balanceQuantity,
      balanceKilos: investment.balanceKilos,
      total: investment.total,
      isFinished: investment.isFinished,
      isDeleted: investment.isDeleted,
      createdAt: investment.createdAt,
      investorIds,
    };
  }
}
