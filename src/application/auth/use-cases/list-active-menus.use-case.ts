import { Inject, Injectable } from '@nestjs/common';
import { Menu } from '@domain/auth/entities/menu';
import {
  MENU_REPOSITORY,
  type MenuRepository,
} from '@domain/auth/repositories/menu.repository';

@Injectable()
export class ListActiveMenusUseCase {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly menuRepository: MenuRepository,
  ) {}

  async execute(): Promise<Menu[]> {
    return this.menuRepository.findAllActive();
  }
}
