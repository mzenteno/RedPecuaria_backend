import { Controller, Get } from '@nestjs/common';
import { ListInvestmentTypesUseCase } from '@application/investment/use-cases/list-investment-types.use-case';
import { InvestmentTypeResponseDto } from './dto/investment-type.response.dto';
import { InvestmentTypeMapper } from './investment-type.mapper';

@Controller('investment-types')
export class InvestmentTypeController {
  constructor(
    private readonly listInvestmentTypesUseCase: ListInvestmentTypesUseCase,
  ) {}

  @Get()
  async list(): Promise<InvestmentTypeResponseDto[]> {
    const investmentTypes = await this.listInvestmentTypesUseCase.execute();
    return investmentTypes.map((investmentType) =>
      InvestmentTypeMapper.toResponse(investmentType),
    );
  }
}
