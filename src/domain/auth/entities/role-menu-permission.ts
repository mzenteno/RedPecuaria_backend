export interface RoleMenuPermissionPersistence {
  id: string | null;
  roleId: string;
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

export class RoleMenuPermission {
  private constructor(
    private readonly _id: string | null,
    public readonly roleId: string,
    public readonly menuId: string,
    private _canView: boolean,
    private _canCreate: boolean,
    private _canEdit: boolean,
    private _canDelete: boolean,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    roleId: string;
    menuId: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }): RoleMenuPermission {
    return new RoleMenuPermission(
      null,
      props.roleId,
      props.menuId,
      props.canView,
      props.canCreate,
      props.canEdit,
      props.canDelete,
      false,
      new Date(),
    );
  }

  static fromPersistence(
    props: RoleMenuPermissionPersistence & { id: string },
  ): RoleMenuPermission {
    return new RoleMenuPermission(
      props.id,
      props.roleId,
      props.menuId,
      props.canView,
      props.canCreate,
      props.canEdit,
      props.canDelete,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('RoleMenuPermission sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get canView(): boolean {
    return this._canView;
  }

  get canCreate(): boolean {
    return this._canCreate;
  }

  get canEdit(): boolean {
    return this._canEdit;
  }

  get canDelete(): boolean {
    return this._canDelete;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  update(props: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }): void {
    this._canView = props.canView;
    this._canCreate = props.canCreate;
    this._canEdit = props.canEdit;
    this._canDelete = props.canDelete;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): RoleMenuPermissionPersistence {
    return {
      id: this._id,
      roleId: this.roleId,
      menuId: this.menuId,
      canView: this._canView,
      canCreate: this._canCreate,
      canEdit: this._canEdit,
      canDelete: this._canDelete,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
