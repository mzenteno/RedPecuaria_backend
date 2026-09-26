import { InvestmentType } from '@domain/investment/entities/investment-type';
import { InvestmentTypeResponseDto } from './dto/investment-type.response.dto';

export class InvestmentTypeMapper {
  static toResponse(investmentType: InvestmentType): InvestmentTypeResponseDto {
    return {
      id: investmentType.id,
      name: investmentType.name,
      createdAt: investmentType.createdAt,
    };
  }
}
