import { Controller, Get } from '@nestjs/common';
import { ListActiveMenusUseCase } from '@application/auth/use-cases/list-active-menus.use-case';
import { MenuCatalogResponseDto } from './dto/menu-catalog.response.dto';

/** Catálogo plano de menús — ver `MenuCatalogResponseDto`. */
@Controller('menus')
export class MenuController {
  constructor(
    private readonly listActiveMenusUseCase: ListActiveMenusUseCase,
  ) {}

  @Get()
  async list(): Promise<MenuCatalogResponseDto[]> {
    const menus = await this.listActiveMenusUseCase.execute();
    return menus.map((menu) => ({
      id: menu.id,
      key: menu.key,
      label: menu.label,
      icon: menu.icon,
      path: menu.path,
      parentId: menu.parentId,
      order: menu.order,
      showInSidebar: menu.showInSidebar,
    }));
  }
}
