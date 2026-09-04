import type { UserRepository } from '@domain/user/repositories/user.repository';
import type { UserTypeRepository } from '@domain/user/repositories/user-type.repository';
import type { UserCompanyRepository } from '@domain/auth/repositories/user-company.repository';
import { InvestorsRequiredException } from '@domain/investment/exceptions/investors-required.exception';
import { InvalidInvestorException } from '@domain/investment/exceptions/invalid-investor.exception';

/**
 * Reglas compartidas por `CreateInvestmentUseCase`/`UpdateInvestmentUseCase`:
 * al menos un inversionista, y cada uno tiene que existir, ser de tipo
 * Inversionista, y pertenecer (con `UserCompany` activo) a la empresa de la
 * inversión — no cualquier usuario del sistema.
 */
export async function validateInvestors(
  userIds: string[],
  companyId: string,
  repos: {
    userRepository: UserRepository;
    userTypeRepository: UserTypeRepository;
    userCompanyRepository: UserCompanyRepository;
  },
): Promise<void> {
  if (userIds.length === 0) {
    throw new InvestorsRequiredException();
  }

  for (const userId of userIds) {
    const user = await repos.userRepository.findById(userId);
    if (!user || user.isDeleted) {
      throw new InvalidInvestorException(userId);
    }

    const userType = await repos.userTypeRepository.findById(user.userTypeId);
    if (!userType || !userType.isInvestor()) {
      throw new InvalidInvestorException(userId);
    }

    const membership = await repos.userCompanyRepository.findByUserAndCompany(
      userId,
      companyId,
    );
    if (!membership || membership.isDeleted) {
      throw new InvalidInvestorException(userId);
    }
  }
}
