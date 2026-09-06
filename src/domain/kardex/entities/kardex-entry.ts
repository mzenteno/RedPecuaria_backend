/**
 * "ingreso": carga general de ganado a la inversión, sin inversionista
 * particular. "venta": movimiento de salida atribuido a un inversionista
 * puntual (a quién se le reparte esa venta). "baja": pérdida/muerte, general
 * como el ingreso, sin inversionista. Ver docs/investment/investment.md —
 * catálogo fijo, no administrable, igual criterio que `UserType`.
 */
export type KardexMovementType = 'ingreso' | 'venta' | 'baja';

export const KARDEX_MOVEMENT_TYPES: KardexMovementType[] = [
  'ingreso',
  'venta',
  'baja',
];

export interface KardexEntryPersistence {
  id: string | null;
  investmentId: string;
  /** `YYYY-MM-DD`, no `Date` — es una fecha de calendario que tipea el
   * usuario (un `<input type="date">`), no un instante con hora. Usar
   * `Date` acá arrastra el bug clásico de que una columna `date` de
   * Postgres se interprete como medianoche UTC y se muestre un día antes
   * en husos horarios negativos. */
  entryDate: string;
  detail: string;
  movementType: KardexMovementType;
  /** Solo presente si `movementType === 'venta'` — validado contra los
   * inversionistas de la inversión, ver `assertKardexInvestor`. */
  investorUserId: string | null;
  avgWeight: number;
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  balanceQuantity: number;
  balanceKilos: number;
  total: number;
  isDeleted: boolean;
  createdAt: Date;
}

export interface KardexEntryFields {
  entryDate: string;
  detail: string;
  movementType: KardexMovementType;
  investorUserId: string | null;
  avgWeight: number;
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  balanceQuantity: number;
  balanceKilos: number;
  total: number;
}

/**
 * Una fila del kardex de inventario de ganado de una `Investment` — ver la
 * planilla de referencia en docs/investment/investment.md. Fase 1
 * deliberadamente sin ningún cálculo: todos los campos los tipea el
 * usuario a mano, ni los saldos corridos ni el `total` se derivan de nada
 * acá — eso queda para una fase futura.
 */
export class KardexEntry {
  private constructor(
    private readonly _id: string | null,
    public readonly investmentId: string,
    private _fields: KardexEntryFields,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    investmentId: string;
    fields: KardexEntryFields;
  }): KardexEntry {
    return new KardexEntry(
      null,
      props.investmentId,
      props.fields,
      false,
      new Date(),
    );
  }

  static fromPersistence(
    props: KardexEntryPersistence & { id: string },
  ): KardexEntry {
    return new KardexEntry(
      props.id,
      props.investmentId,
      {
        entryDate: props.entryDate,
        detail: props.detail,
        movementType: props.movementType,
        investorUserId: props.investorUserId,
        avgWeight: props.avgWeight,
        entryQuantity: props.entryQuantity,
        entryKilos: props.entryKilos,
        exitQuantity: props.exitQuantity,
        exitKilos: props.exitKilos,
        balanceQuantity: props.balanceQuantity,
        balanceKilos: props.balanceKilos,
        total: props.total,
      },
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('KardexEntry sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get fields(): KardexEntryFields {
    return this._fields;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  update(fields: KardexEntryFields): void {
    this._fields = fields;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): KardexEntryPersistence {
    return {
      id: this._id,
      investmentId: this.investmentId,
      ...this._fields,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
