export interface InvestmentTypePersistence {
  id: string | null;
  name: string;
  isDeleted: boolean;
  createdAt: Date;
}

/**
 * "kilo": el modo original — cada movimiento anota cantidad y kilos, el
 * saldo físico vigente es `Investment.balanceKilos`. "dinero": mismo
 * criterio exacto, pero en vez de kilos se anota dinero — el saldo físico
 * vigente pasa a ser `Investment.total` (Ingreso lo suma, Venta lo resta).
 * Ninguno de los dos tiene piso en 0 — solo `Investment.balanceQuantity` lo
 * tiene (ver `Investment.applyBalanceDelta` y `computeMovementDelta`).
 * Catálogo cerrado (`investment_types`), fijo desde la creación de la
 * inversión (no se puede editar después) — mismo criterio que
 * `MovementType` (ver docs/investment/investment.md).
 */
export const INVESTMENT_TYPE_KILO_NAME = 'kilo';
export const INVESTMENT_TYPE_DINERO_NAME = 'dinero';

export class InvestmentType {
  private constructor(
    private readonly _id: string | null,
    private _name: string,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: { name: string }): InvestmentType {
    return new InvestmentType(null, props.name, false, new Date());
  }

  static fromPersistence(
    props: InvestmentTypePersistence & { id: string },
  ): InvestmentType {
    return new InvestmentType(
      props.id,
      props.name,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('InvestmentType sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  isKilo(): boolean {
    return this._name === INVESTMENT_TYPE_KILO_NAME;
  }

  isDinero(): boolean {
    return this._name === INVESTMENT_TYPE_DINERO_NAME;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): InvestmentTypePersistence {
    return {
      id: this._id,
      name: this._name,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
