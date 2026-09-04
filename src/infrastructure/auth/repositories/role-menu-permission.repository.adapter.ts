import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { RoleMenuPermission } from '@domain/auth/entities/role-menu-permission';
import { RoleMenuPermissionRepository } from '@domain/auth/repositories/role-menu-permission.repository';
import { RoleMenuPermissionEntity } from '../entities/role-menu-permission.entity';

@Injectable()
export class RoleMenuPermissionRepositoryAdapter implements RoleMenuPermissionRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByRoleAndMenu(
    roleId: string,
    menuId: string,
    ctx?: TransactionContext,
  ): Promise<RoleMenuPermission | null> {
    const row = await this.repository(ctx).findOne({
      where: { roleId, menuId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByRole(
    roleId: string,
    ctx?: TransactionContext,
  ): Promise<RoleMenuPermission[]> {
    const rows = await this.repository(ctx).find({ where: { roleId } });
    return rows.map((row) => this.toDomain(row));
  }

  async save(
    permission: RoleMenuPermission,
    ctx?: TransactionContext,
  ): Promise<RoleMenuPermission> {
    const saved = await this.repository(ctx).save(this.toEntity(permission));
    return this.toDomain(saved);
  }

  private repository(
    ctx?: TransactionContext,
  ): Repository<RoleMenuPermissionEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(RoleMenuPermissionEntity)
      : this.dataSource.getRepository(RoleMenuPermissionEntity);
  }

  private toDomain(row: RoleMenuPermissionEntity): RoleMenuPermission {
    return RoleMenuPermission.fromPersistence({
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      canView: row.canView,
      canCreate: row.canCreate,
      canEdit: row.canEdit,
      canDelete: row.canDelete,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(permission: RoleMenuPermission): RoleMenuPermissionEntity {
    const snapshot = permission.toPersistence();
    const row = new RoleMenuPermissionEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.roleId = snapshot.roleId;
    row.menuId = snapshot.menuId;
    row.canView = snapshot.canView;
    row.canCreate = snapshot.canCreate;
    row.canEdit = snapshot.canEdit;
    row.canDelete = snapshot.canDelete;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
