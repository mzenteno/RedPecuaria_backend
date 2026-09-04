import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Menu } from '../entities/menu';

export const MENU_REPOSITORY = Symbol('MenuRepository');

export interface MenuRepository {
  findById(id: string, ctx?: TransactionContext): Promise<Menu | null>;
  findByKey(key: string, ctx?: TransactionContext): Promise<Menu | null>;
  /** Catálogo completo, activo, para armar el árbol de navegación. */
  findAllActive(ctx?: TransactionContext): Promise<Menu[]>;
  save(menu: Menu, ctx?: TransactionContext): Promise<Menu>;
}
