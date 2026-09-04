import { UserCompany } from '@domain/auth/entities/user-company';
import { UserCompanyResponseDto } from './dto/user-company.response.dto';

export class UserCompanyMapper {
  static toResponse(userCompany: UserCompany): UserCompanyResponseDto {
    return {
      id: userCompany.id,
      userId: userCompany.userId,
      companyId: userCompany.companyId,
      roleId: userCompany.roleId,
      isDeleted: userCompany.isDeleted,
      createdAt: userCompany.createdAt,
    };
  }
}
