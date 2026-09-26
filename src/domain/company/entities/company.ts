export interface CompanyPersistence {
  id: string | null;
  name: string;
  /** URL pública absoluta del logo ya guardado (ver `FileStorage` en
   * `domain/core/ports`) — `null` mientras no se suba ninguno. Esta
   * entidad no sabe nada de archivos/disco, solo guarda el resultado. */
  logoUrl: string | null;
  isDeleted: boolean;
  createdAt: Date;
}

/**
 * Empresa (tenant) del sistema multiempresa. El id es null hasta que se
 * persiste (lo asigna Postgres al insertar) — ver ARCHITECTURE.md §7 y
 * docs/company/changes/2026-08-23-cambio-ids-a-bigint.md.
 */
export class Company {
  private constructor(
    private readonly _id: string | null,
    private _name: string,
    private _logoUrl: string | null,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: { name: string }): Company {
    return new Company(null, props.name, null, false, new Date());
  }

  static fromPersistence(props: CompanyPersistence & { id: string }): Company {
    return new Company(
      props.id,
      props.name,
      props.logoUrl,
      props.isDeleted,
      props.createdAt,
    );
  }

  /** Lanza si todavía no fue persistida. Úsese después de `repository.save()`. */
  get id(): string {
    if (this._id === null) {
      throw new Error('Company sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get logoUrl(): string | null {
    return this._logoUrl;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  rename(name: string): void {
    this._name = name;
  }

  /** `null` para quitar el logo (ver `RemoveCompanyLogoUseCase`) — quien
   * llama (`UpdateCompanyLogoUseCase`) es responsable de haber guardado el
   * archivo antes y de borrar el anterior después, vía `FileStorage`; esta
   * entidad solo guarda la URL resultante, no conoce archivos. */
  updateLogo(logoUrl: string | null): void {
    this._logoUrl = logoUrl;
  }

  /** Baja lógica — "desactivar" en el vocabulario de negocio, `isDeleted`
   * en la persistencia (ver ARCHITECTURE.md §7 sobre el nombre del campo). */
  deactivate(): void {
    this._isDeleted = true;
  }

  /** Solo para el mapper de infraestructura del propio módulo. */
  toPersistence(): CompanyPersistence {
    return {
      id: this._id,
      name: this._name,
      logoUrl: this._logoUrl,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
