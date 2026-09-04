export class MenuResponseDto {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  path: string | null;
  parentId: string | null;
  order: number;
  showInSidebar: boolean;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
