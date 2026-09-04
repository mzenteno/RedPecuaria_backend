export interface PropertyPersistence {
  id: string | null;
  companyId: string;
  name: string;
  latitude: number;
  longitude: number;
  isDeleted: boolean;
  createdAt: Date;
}

/**
 * Propiedad (finca ganadera) — pertenece a una empresa, tiene ubicación
 * (lat/lng) para mostrarla en un mapa. Primer concepto del negocio ganadero
 * en sí, ver docs/property/property.md.
 */
export class Property {
  private constructor(
    private readonly _id: string | null,
    public readonly companyId: string,
    private _name: string,
    private _latitude: number,
    private _longitude: number,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    companyId: string;
    name: string;
    latitude: number;
    longitude: number;
  }): Property {
    return new Property(
      null,
      props.companyId,
      props.name,
      props.latitude,
      props.longitude,
      false,
      new Date(),
    );
  }

  static fromPersistence(
    props: PropertyPersistence & { id: string },
  ): Property {
    return new Property(
      props.id,
      props.companyId,
      props.name,
      props.latitude,
      props.longitude,
      props.isDeleted,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('Property sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  update(props: { name: string; latitude: number; longitude: number }): void {
    this._name = props.name;
    this._latitude = props.latitude;
    this._longitude = props.longitude;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): PropertyPersistence {
    return {
      id: this._id,
      companyId: this.companyId,
      name: this._name,
      latitude: this._latitude,
      longitude: this._longitude,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
