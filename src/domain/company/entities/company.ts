export interface CompanyPersistence {
  id: string | null;
  name: string;
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
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: { name: string }): Company {
    return new Company(null, props.name, false, new Date());
  }

  static fromPersistence(props: CompanyPersistence & { id: string }): Company {
    return new Company(props.id, props.name, props.isDeleted, props.createdAt);
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

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  rename(name: string): void {
    this._name = name;
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
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
