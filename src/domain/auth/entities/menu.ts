export interface MenuPersistence {
  id: string | null;
  key: string;
  label: string;
  icon: string | null;
  path: string | null;
  parentId: string | null;
  order: number;
  /** `false` para un menú que existe solo como permiso (ej. `kardex`, un
   * drill-down sin entrada propia en el sidebar) — ver `menu.md`. */
  showInSidebar: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

export class Menu {
  private constructor(
    private readonly _id: string | null,
    private _key: string,
    private _label: string,
    private _icon: string | null,
    private _path: string | null,
    public readonly parentId: string | null,
    private _order: number,
    private _showInSidebar: boolean,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    key: string;
    label: string;
    icon?: string | null;
    path?: string | null;
    parentId?: string | null;
    order: number;
    showInSidebar?: boolean;
  }): Menu {
    return new Menu(
      null,
      props.key,
      props.label,
      props.icon ?? null,
      props.path ?? null,
      props.parentId ?? null,
      props.order,
      props.showInSidebar ?? true,
      false,
      new Date(),
    );
  }

  static fromPersistence(props: MenuPersistence & { id: string }): Menu {
    return new Menu(
      props.id,
      props.key,
      props.label,
      props.icon,
      props.path,
      props.parentId,
      props.order,
      props.showInSidebar,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('Menu sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get key(): string {
    return this._key;
  }

  get label(): string {
    return this._label;
  }

  get icon(): string | null {
    return this._icon;
  }

  get path(): string | null {
    return this._path;
  }

  get order(): number {
    return this._order;
  }

  get showInSidebar(): boolean {
    return this._showInSidebar;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): MenuPersistence {
    return {
      id: this._id,
      key: this._key,
      label: this._label,
      icon: this._icon,
      path: this._path,
      parentId: this.parentId,
      order: this._order,
      showInSidebar: this._showInSidebar,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
