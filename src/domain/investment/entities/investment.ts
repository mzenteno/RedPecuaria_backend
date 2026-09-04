export interface InvestmentPersistence {
  id: string | null;
  propertyId: string;
  gestion: number;
  description: string;
  isDeleted: boolean;
  createdAt: Date;
}

/**
 * El negocio de compra de ganado enviado a una `Property` — uno o más
 * usuarios (tipo Inversionista) participan de ella. `gestion` es un año
 * (no texto libre, se muestra en un combobox en el frontend). Sin campo
 * "lote": `description` es libre para diferenciar inversiones de la misma
 * propiedad (ver docs/investment/investment.md).
 */
export class Investment {
  private constructor(
    private readonly _id: string | null,
    public readonly propertyId: string,
    private _gestion: number,
    private _description: string,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    propertyId: string;
    gestion: number;
    description: string;
  }): Investment {
    return new Investment(
      null,
      props.propertyId,
      props.gestion,
      props.description,
      false,
      new Date(),
    );
  }

  static fromPersistence(
    props: InvestmentPersistence & { id: string },
  ): Investment {
    return new Investment(
      props.id,
      props.propertyId,
      props.gestion,
      props.description,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('Investment sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get gestion(): number {
    return this._gestion;
  }

  get description(): string {
    return this._description;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  update(props: { gestion: number; description: string }): void {
    this._gestion = props.gestion;
    this._description = props.description;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): InvestmentPersistence {
    return {
      id: this._id,
      propertyId: this.propertyId,
      gestion: this._gestion,
      description: this._description,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
