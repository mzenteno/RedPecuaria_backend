import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Menu } from '@domain/auth/entities/menu';
import { MenuRepository } from '@domain/auth/repositories/menu.repository';
import { MenuEntity } from '../entities/menu.entity';

@Injectable()
export class MenuRepositoryAdapter implements MenuRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findById(id: string, ctx?: TransactionContext): Promise<Menu | null> {
    const row = await this.repository(ctx).findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByKey(key: string, ctx?: TransactionContext): Promise<Menu | null> {
    const row = await this.repository(ctx).findOne({ where: { key } });
    return row ? this.toDomain(row) : null;
  }

  async findAllActive(ctx?: TransactionContext): Promise<Menu[]> {
    const rows = await this.repository(ctx).find({
      where: { isDeleted: false },
      order: { order: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(menu: Menu, ctx?: TransactionContext): Promise<Menu> {
    const saved = await this.repository(ctx).save(this.toEntity(menu));
    return this.toDomain(saved);
  }

  private repository(ctx?: TransactionContext): Repository<MenuEntity> {
    return ctx
      ? (ctx as EntityManager).getRepository(MenuEntity)
      : this.dataSource.getRepository(MenuEntity);
  }

  private toDomain(row: MenuEntity): Menu {
    return Menu.fromPersistence({
      id: row.id,
      key: row.key,
      label: row.label,
      icon: row.icon,
      path: row.path,
      parentId: row.parentId,
      order: row.order,
      showInSidebar: row.showInSidebar,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
    });
  }

  private toEntity(menu: Menu): MenuEntity {
    const snapshot = menu.toPersistence();
    const row = new MenuEntity();
    if (snapshot.id !== null) {
      row.id = snapshot.id;
    }
    row.key = snapshot.key;
    row.label = snapshot.label;
    row.icon = snapshot.icon;
    row.path = snapshot.path;
    row.parentId = snapshot.parentId;
    row.order = snapshot.order;
    row.showInSidebar = snapshot.showInSidebar;
    row.isDeleted = snapshot.isDeleted;
    row.createdAt = snapshot.createdAt;
    return row;
  }
}
