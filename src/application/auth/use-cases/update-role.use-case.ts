import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@domain/auth/entities/role';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import { RoleNotFoundException } from '@domain/auth/exceptions/role-not-found.exception';
import { RoleAlreadyExistsException } from '@domain/auth/exceptions/role-already-exists.exception';

export interface UpdateRoleInput {
  roleId: string;
  /** Empresa activa de quien hace la petición — el rol tiene que ser suyo.
   * Sin este chequeo, cualquiera podía editar un rol de otra empresa
   * adivinando su id (mismo hueco que ya se había cerrado en `create`/`list`,
   * ver docs/role/role.md). */
  companyId: string;
  name: string;
}

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: UpdateRoleInput): Promise<Role> {
    const role = await this.roleRepository.findById(input.roleId);
    // Mismo mensaje/código que "no existe" a propósito — no hay que confirmarle
    // a quien pregunta que el rol sí existe, solo que no está en otra empresa.
    if (!role || role.companyId !== input.companyId) {
      throw new RoleNotFoundException(input.roleId);
    }

    if (role.name !== input.name) {
      const existing = await this.roleRepository.findByCompanyAndName(
        role.companyId,
        input.name,
      );
      if (existing) {
        throw new RoleAlreadyExistsException(input.name);
      }
    }

    role.rename(input.name);
    return this.roleRepository.save(role);
  }
}
