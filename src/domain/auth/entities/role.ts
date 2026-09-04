import { InvalidRoleNameException } from '../exceptions/invalid-role-name.exception';

export interface RolePersistence {
  id: string | null;
  companyId: string;
  name: string;
  isDeleted: boolean;
  createdAt: Date;
}

export class Role {
  private constructor(
    private readonly _id: string | null,
    public readonly companyId: string,
    private _name: string,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: { companyId: string; name: string }): Role {
    Role.validateName(props.name);
    return new Role(null, props.companyId, props.name, false, new Date());
  }

  static fromPersistence(props: RolePersistence & { id: string }): Role {
    return new Role(
      props.id,
      props.companyId,
      props.name,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('Role sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  rename(name: string): void {
    Role.validateName(name);
    this._name = name;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): RolePersistence {
    return {
      id: this._id,
      companyId: this.companyId,
      name: this._name,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }

  private static validateName(name: string): void {
    if (name.trim().length === 0) {
      throw new InvalidRoleNameException();
    }
  }
}
