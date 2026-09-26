import { Inject, Injectable } from '@nestjs/common';
import {
  PaginatedResult,
  PaginationParams,
} from '@domain/common/paginated-result';
import {
  USER_REPOSITORY,
  type UserRepository,
  type UserWithType,
} from '@domain/user/repositories/user.repository';

export interface ListUsersInput extends PaginationParams {
  companyId: string;
  /** Viene tal cual del JWT (`@CurrentUser('isSuperAdmin')`) — se traduce
   * acá a `excludeSuperAdmins` para el repositorio, mismo criterio que
   * `viewerIsInvestor` → `restrictSalesToInvestorId` en
   * `ListKardexEntriesByInvestmentUseCase` (a pedido del usuario,
   * 2026-09-25: alguien que no es Super Administrador no puede ver
   * usuarios de ese tipo en el listado). */
  viewerIsSuperAdmin: boolean;
}

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListUsersInput): Promise<PaginatedResult<UserWithType>> {
    return this.userRepository.findAllPaginated({
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
      companyId: input.companyId,
      excludeSuperAdmins: !input.viewerIsSuperAdmin,
    });
  }
}
