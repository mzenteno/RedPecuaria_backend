export interface MovementTypePersistence {
  id: string | null;
  name: string;
  isDeleted: boolean;
  createdAt: Date;
}

/**
 * "ingreso": carga general de ganado a la inversión, sin inversionista
 * particular. "venta": movimiento de salida atribuido a un inversionista
 * puntual (a quién se le reparte esa venta). "baja": pérdida/muerte, general
 * como el ingreso, sin inversionista. Ver docs/investment/investment.md —
 * catálogo fijo (`kardex_movement_types`), no administrable por API (solo
 * `GET /kardex-movement-types` para listar) — mismo criterio que `UserType`.
 */
export const MOVEMENT_TYPE_INGRESO_NAME = 'ingreso';
export const MOVEMENT_TYPE_VENTA_NAME = 'venta';
export const MOVEMENT_TYPE_BAJA_NAME = 'baja';

export class MovementType {
  private constructor(
    private readonly _id: string | null,
    private _name: string,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: { name: string }): MovementType {
    return new MovementType(null, props.name, false, new Date());
  }

  static fromPersistence(
    props: MovementTypePersistence & { id: string },
  ): MovementType {
    return new MovementType(
      props.id,
      props.name,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('MovementType sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  isIngreso(): boolean {
    return this._name === MOVEMENT_TYPE_INGRESO_NAME;
  }

  isVenta(): boolean {
    return this._name === MOVEMENT_TYPE_VENTA_NAME;
  }

  isBaja(): boolean {
    return this._name === MOVEMENT_TYPE_BAJA_NAME;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): MovementTypePersistence {
    return {
      id: this._id,
      name: this._name,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
