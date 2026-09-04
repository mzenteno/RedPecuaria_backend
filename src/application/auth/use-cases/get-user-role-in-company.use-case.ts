import { Inject, Injectable } from '@nestjs/common';
import { UserCompany } from '@domain/auth/entities/user-company';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import { NoActiveUserCompanyException } from '@domain/auth/exceptions/no-active-user-company.exception';

export interface GetUserRoleInCompanyInput {
  userId: string;
  companyId: string;
}

/**
 * Da el vínculo (`UserCompany`, con su `id` y `roleId`) de un usuario en una
 * empresa puntual — siempre la empresa activa de quien pregunta, nunca una
 * elegida a mano. Lo usa la pantalla de Usuarios para saber qué rol tiene
 * hoy alguien antes de dejarlo cambiar, y para saber qué `userCompanyId`
 * mandarle a `PATCH /user-companies/:id/role`.
 */
@Injectable()
export class GetUserRoleInCompanyUseCase {
  constructor(
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
  ) {}

  async execute(input: GetUserRoleInCompanyInput): Promise<UserCompany> {
    const userCompany = await this.userCompanyRepository.findByUserAndCompany(
      input.userId,
      input.companyId,
    );
    if (!userCompany || userCompany.isDeleted) {
      throw new NoActiveUserCompanyException();
    }
    return userCompany;
  }
}
