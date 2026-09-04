import { AuthorizedMenuItem } from '@application/auth/use-cases/get-authorized-menu.use-case';
import { MenuResponseDto } from './dto/menu.response.dto';

export class MenuMapper {
  static toAuthorizedResponse(item: AuthorizedMenuItem): MenuResponseDto {
    return {
      id: item.menu.id,
      key: item.menu.key,
      label: item.menu.label,
      icon: item.menu.icon,
      path: item.menu.path,
      parentId: item.menu.parentId,
      order: item.menu.order,
      showInSidebar: item.menu.showInSidebar,
      canView: item.permission?.canView ?? false,
      canCreate: item.permission?.canCreate ?? false,
      canEdit: item.permission?.canEdit ?? false,
      canDelete: item.permission?.canDelete ?? false,
    };
  }
}
