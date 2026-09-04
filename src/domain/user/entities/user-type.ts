export interface UserTypePersistence {
  id: string | null;
  name: string;
  isDeleted: boolean;
  createdAt: Date;
}

/**
 * Único tipo con visibilidad multi-empresa (ver `ListCompaniesUseCase`) — el
 * resto (Administrador, Inversionista) solo ve la empresa de su sesión
 * actual. Nombre fijo porque `user_types` no se crea/renombra por API (solo
 * `GET /user-types` para listar), es un catálogo cerrado sembrado por
 * migración.
 */
export const SUPER_ADMIN_USER_TYPE_NAME = 'Super Administrador';
/** Ver `docs/investment/investment.md` — solo un usuario de este tipo puede
 * asignarse como inversionista de una `Investment`. */
export const INVESTOR_USER_TYPE_NAME = 'Inversionista';

export class UserType {
  private constructor(
    private readonly _id: string | null,
    private _name: string,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: { name: string }): UserType {
    return new UserType(null, props.name, false, new Date());
  }

  static fromPersistence(
    props: UserTypePersistence & { id: string },
  ): UserType {
    return new UserType(props.id, props.name, props.isDeleted, props.createdAt);
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('UserType sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  isSuperAdmin(): boolean {
    return this._name === SUPER_ADMIN_USER_TYPE_NAME;
  }

  isInvestor(): boolean {
    return this._name === INVESTOR_USER_TYPE_NAME;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): UserTypePersistence {
    return {
      id: this._id,
      name: this._name,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
