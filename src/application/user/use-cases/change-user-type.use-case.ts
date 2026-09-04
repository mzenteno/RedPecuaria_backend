import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';
import {
  USER_TYPE_REPOSITORY,
  type UserTypeRepository,
} from '@domain/user/repositories/user-type.repository';
import { UserTypeNotFoundException } from '@domain/user/exceptions/user-type-not-found.exception';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';

export interface ChangeUserTypeInput {
  userId: string;
  /** El usuario objetivo tiene que pertenecer a la empresa activa de quien
   * hace el cambio — sin esto, cualquiera con sesión podía cambiar el
   * `UserType` (incluso a "Super Administrador") de un usuario de **otra**
   * empresa con la que no tiene ninguna relación, adivinando su id. */
  companyId: string;
  userTypeId: string;
}

@Injectable()
export class ChangeUserTypeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(USER_TYPE_REPOSITORY)
    private readonly userTypeRepository: UserTypeRepository,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
  ) {}

  async execute(input: ChangeUserTypeInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    const membership = await this.userCompanyRepository.findByUserAndCompany(
      input.userId,
      input.companyId,
    );
    if (!membership || membership.isDeleted) {
      throw new UserNotFoundException(input.userId);
    }

    const userType = await this.userTypeRepository.findById(input.userTypeId);
    if (!userType) {
      throw new UserTypeNotFoundException(input.userTypeId);
    }

    user.changeUserType(input.userTypeId);
    await this.userRepository.save(user);
  }
}
