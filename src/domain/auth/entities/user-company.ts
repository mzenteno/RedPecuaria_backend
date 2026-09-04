export interface UserCompanyPersistence {
  id: string | null;
  userId: string;
  companyId: string;
  roleId: string;
  isDeleted: boolean;
  createdAt: Date;
}

export class UserCompany {
  private constructor(
    private readonly _id: string | null,
    public readonly userId: string,
    public readonly companyId: string,
    private _roleId: string,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    userId: string;
    companyId: string;
    roleId: string;
  }): UserCompany {
    return new UserCompany(
      null,
      props.userId,
      props.companyId,
      props.roleId,
      false,
      new Date(),
    );
  }

  static fromPersistence(
    props: UserCompanyPersistence & { id: string },
  ): UserCompany {
    return new UserCompany(
      props.id,
      props.userId,
      props.companyId,
      props.roleId,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('UserCompany sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get roleId(): string {
    return this._roleId;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  changeRole(roleId: string): void {
    this._roleId = roleId;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): UserCompanyPersistence {
    return {
      id: this._id,
      userId: this.userId,
      companyId: this.companyId,
      roleId: this._roleId,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
