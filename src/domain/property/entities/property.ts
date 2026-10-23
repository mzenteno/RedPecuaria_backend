import { InvalidPropertyBoundaryException } from '../exceptions/invalid-property-boundary.exception';

/** Vértice del contorno — `lat`/`lng` en grados decimales (WGS84, lo mismo
 * que `latitude`/`longitude`). */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Mínimo de vértices para que el polígono encierre una superficie. */
const MIN_BOUNDARY_POINTS = 3;

export interface PropertyPersistence {
  id: string | null;
  companyId: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Contorno (perímetro) de la propiedad, opcional — independiente del
   * punto `latitude`/`longitude`, que se marca aparte (a pedido del
   * usuario, 2026-10-23). El polígono se cierra solo: el último vértice NO
   * repite al primero. */
  boundary: GeoPoint[] | null;
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
    private _boundary: GeoPoint[] | null,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    companyId: string;
    name: string;
    latitude: number;
    longitude: number;
    boundary?: GeoPoint[] | null;
  }): Property {
    const boundary = props.boundary ?? null;
    Property.assertValidBoundary(boundary);
    return new Property(
      null,
      props.companyId,
      props.name,
      props.latitude,
      props.longitude,
      boundary,
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
      props.boundary,
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

  get boundary(): GeoPoint[] | null {
    return this._boundary;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  /** `boundary`: `undefined` = no tocarlo (ej. mobile, que todavía no
   * edita el contorno y no lo manda), `null` = borrarlo. */
  update(props: {
    name: string;
    latitude: number;
    longitude: number;
    boundary?: GeoPoint[] | null;
  }): void {
    this._name = props.name;
    this._latitude = props.latitude;
    this._longitude = props.longitude;
    if (props.boundary !== undefined) {
      Property.assertValidBoundary(props.boundary);
      this._boundary = props.boundary;
    }
  }

  private static assertValidBoundary(boundary: GeoPoint[] | null): void {
    if (boundary !== null && boundary.length < MIN_BOUNDARY_POINTS) {
      throw new InvalidPropertyBoundaryException();
    }
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
      boundary: this._boundary,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
