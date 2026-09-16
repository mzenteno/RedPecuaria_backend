import { Company } from '@domain/company/entities/company';
import { CompanyResponseDto } from './dto/company.response.dto';

export class CompanyMapper {
  static toResponse(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      createdAt: company.createdAt,
    };
  }
}
