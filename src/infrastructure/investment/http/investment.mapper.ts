import { Investment } from '@domain/investment/entities/investment';
import { InvestmentResponseDto } from './dto/investment.response.dto';
import { InvestmentListItemResponseDto } from './dto/investment-list-item.response.dto';

export class InvestmentMapper {
  static toResponse(
    investment: Investment,
    investorIds: string[],
    propertyName: string,
  ): InvestmentResponseDto {
    return {
      id: investment.id,
      propertyId: investment.propertyId,
      propertyName,
      gestion: investment.gestion,
      description: investment.description,
      balanceQuantity: investment.balanceQuantity,
      balanceKilos: investment.balanceKilos,
      total: investment.total,
      isFinished: investment.isFinished,
      createdAt: investment.createdAt,
      investorIds,
    };
  }

  static toListResponse(
    investment: Investment,
    investorIds: string[],
    propertyName: string,
  ): InvestmentListItemResponseDto {
    return {
      id: investment.id,
      propertyId: investment.propertyId,
      propertyName,
      gestion: investment.gestion,
      description: investment.description,
      isFinished: investment.isFinished,
      createdAt: investment.createdAt,
      investorIds,
    };
  }
}
