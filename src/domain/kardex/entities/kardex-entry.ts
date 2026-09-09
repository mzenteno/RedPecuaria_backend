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
  /** FK a `kardex_movement_types` (catálogo cerrado, ver
   * `domain/kardex/entities/movement-type.ts`) — nunca un string literal
   * acá, mismo criterio que `User.userTypeId`. */
  movementTypeId: string;
  /** Solo presente si el tipo de movimiento es "venta" — validado contra
   * los inversionistas de la inversión, ver `assertKardexInvestor`. */
  investorUserId: string | null;
  avgWeight: number;
  /** Ingreso: carga cantidad y kilos. Baja: solo cantidad (`exitQuantity`),
   * no toca kilos. Venta: cantidad y kilos de salida. Ver
   * `computeMovementDelta` en `application/kardex` para el detalle exacto
   * por tipo. */
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  /** Dato que tipea el usuario, solo en Ingreso y Venta (0 en Baja) — no se
   * deriva de nada. Se acumula en `Investment.total`, ver
   * `computeMovementDelta`. */
  total: number;
  isDeleted: boolean;
  createdAt: Date;
}

export interface KardexEntryFields {
  entryDate: string;
  detail: string;
  movementTypeId: string;
  investorUserId: string | null;
  avgWeight: number;
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  total: number;
}

/**
 * Una fila del kardex de inventario de ganado de una `Investment` — ver la
 * planilla de referencia en docs/investment/investment.md. Es un log puro:
 * no guarda saldo corrido propio (`balanceQuantity`/`balanceKilos` viven en
 * `Investment`, ver ese archivo) — todos los campos acá son los que tipea
 * el usuario para ESE movimiento puntual, nada se deriva dentro de esta
 * entidad.
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
        movementTypeId: props.movementTypeId,
        investorUserId: props.investorUserId,
        avgWeight: props.avgWeight,
        entryQuantity: props.entryQuantity,
        entryKilos: props.entryKilos,
        exitQuantity: props.exitQuantity,
        exitKilos: props.exitKilos,
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
