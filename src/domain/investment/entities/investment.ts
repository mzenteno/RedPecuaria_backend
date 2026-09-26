import { InsufficientInvestmentBalanceException } from '../exceptions/insufficient-investment-balance.exception';

export interface InvestmentPersistence {
  id: string | null;
  propertyId: string;
  gestion: number;
  description: string;
  /** FK a `investment_types` (catálogo cerrado, `'kilo'`/`'dinero'`) — fijo
   * desde la creación, nunca se edita (ver `Investment.update`, que no lo
   * toca). Esta entidad guarda solo el id, igual criterio que
   * `KardexEntry.movementTypeId`: no interpreta su significado — quien
   * necesita saber si es "kilo"/"dinero" (`computeMovementDelta`) lo
   * resuelve aparte. */
  investmentTypeId: string;
  balanceQuantity: number;
  balanceKilos: number;
  total: number;
  /** Estado de negocio (activa/terminada) — a diferencia de `isDeleted`
   * (baja administrativa, oculta el registro), esto es información sobre
   * el ciclo de vida de la inversión: sigue totalmente visible y operable,
   * solo indica que ya se vendió todo el stock. Nunca se calcula solo — lo
   * marca el usuario a mano (ver `docs/investment/investment.md`). */
  isFinished: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

/** Efecto de un movimiento de kardex sobre el saldo vigente de una
 * inversión — quién arma este delta según el tipo de movimiento
 * (ingreso/baja/venta) es `computeMovementDelta` en `application/kardex`,
 * no esta entidad: `Investment` no conoce `KardexMovementType`, solo sabe
 * aplicar y validar un delta genérico. */
export interface InvestmentBalanceDelta {
  quantity: number;
  kilos: number;
  total: number;
}

/**
 * El negocio de compra de ganado enviado a una `Property` — uno o más
 * usuarios (tipo Inversionista) participan de ella. `gestion` es un año
 * (no texto libre, se muestra en un combobox en el frontend). Sin campo
 * "lote": `description` es libre para diferenciar inversiones de la misma
 * propiedad (ver docs/investment/investment.md).
 *
 * `balanceQuantity`/`balanceKilos`/`total` son el saldo vigente — antes
 * vivían como una foto por fila en `kardex_entries` (el saldo después de
 * cada movimiento); ahora `kardex_entries` es un log puro y esta es la
 * única fuente del estado actual, mantenida transaccionalmente en cada alta/
 * edición/baja de un `KardexEntry` (ver `CreateKardexEntryUseCase` y
 * afines) — excepción deliberada al criterio de "no duplicar datos
 * derivados" del resto del proyecto, justificada porque el saldo se
 * necesita leer en cada movimiento nuevo (para no dejarlo negativo), no
 * solo para mostrarlo.
 */
export class Investment {
  private constructor(
    private readonly _id: string | null,
    private _propertyId: string,
    private readonly _investmentTypeId: string,
    private _gestion: number,
    private _description: string,
    private _balanceQuantity: number,
    private _balanceKilos: number,
    private _total: number,
    private _isFinished: boolean,
    private _isDeleted: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    propertyId: string;
    investmentTypeId: string;
    gestion: number;
    description: string;
  }): Investment {
    return new Investment(
      null,
      props.propertyId,
      props.investmentTypeId,
      props.gestion,
      props.description,
      0,
      0,
      0,
      false,
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
      props.investmentTypeId,
      props.gestion,
      props.description,
      props.balanceQuantity,
      props.balanceKilos,
      props.total,
      props.isFinished,
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

  get propertyId(): string {
    return this._propertyId;
  }

  get investmentTypeId(): string {
    return this._investmentTypeId;
  }

  get gestion(): number {
    return this._gestion;
  }

  get description(): string {
    return this._description;
  }

  get balanceQuantity(): number {
    return this._balanceQuantity;
  }

  get balanceKilos(): number {
    return this._balanceKilos;
  }

  get total(): number {
    return this._total;
  }

  get isFinished(): boolean {
    return this._isFinished;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  /** `propertyId` sí se puede cambiar acá — a diferencia de otros módulos
   * (ej. `User.username`), no hay ninguna regla de negocio que lo impida:
   * la inversión sigue siendo la misma entidad, solo cambia a qué
   * propiedad está asociada. El caso de uso (`UpdateInvestmentUseCase`)
   * valida que la propiedad nueva exista y sea de la empresa activa antes
   * de llamar acá — la entidad no conoce `Property` ni `companyId`.
   *
   * `isFinished` es una elección manual del usuario, no un cálculo — nada
   * acá revisa `balanceQuantity`/`balanceKilos` para forzarlo. La idea de
   * uso es que el usuario lo marque cuando el saldo llegue a 0, pero eso no
   * se valida ni se fuerza (ver docs/investment/investment.md). */
  update(props: {
    propertyId: string;
    gestion: number;
    description: string;
    isFinished: boolean;
  }): void {
    this._propertyId = props.propertyId;
    this._gestion = props.gestion;
    this._description = props.description;
    this._isFinished = props.isFinished;
  }

  /**
   * Aplica el efecto neto de un movimiento de kardex sobre el saldo
   * vigente. Nunca deja `balanceQuantity` en negativo — no se puede dar de
   * baja o vender más cabezas de las que hay.
   *
   * El "saldo físico" secundario (`balanceKilos` en modo "kilo", `total` en
   * modo "dinero") **no tiene piso en 0** (a pedido del usuario,
   * 2026-09-26): a diferencia de la cantidad de cabezas, es totalmente
   * válido que quede negativo — el peso/precio promedio de una Venta o
   * Baja puntual no tiene por qué coincidir con el promedio acumulado del
   * resto del historial, así que puede perfectamente "gastar más kilos/Bs.
   * de los que quedaban" sin que eso sea un error de carga. Antes se
   * validaba igual que la cantidad (`InsufficientInvestmentBalanceException`
   * también acá, recibiendo el `InvestmentType` para decidir cuál de los
   * dos campos mirar) — ver
   * `docs/investment/changes/2026-09-26-sin-piso-en-kilos-o-dinero.md`. Ya
   * no hace falta ese parámetro: quien llama sigue necesitando el
   * `InvestmentType` resuelto para `computeMovementDelta`, pero eso es un
   * fetch aparte, no algo que este método tenga que recibir.
   */
  applyBalanceDelta(delta: InvestmentBalanceDelta): void {
    const newBalanceQuantity = this._balanceQuantity + delta.quantity;
    if (newBalanceQuantity < 0) {
      throw new InsufficientInvestmentBalanceException(this._id ?? '(nueva)');
    }
    this._balanceQuantity = newBalanceQuantity;
    this._balanceKilos = this._balanceKilos + delta.kilos;
    this._total = this._total + delta.total;
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  toPersistence(): InvestmentPersistence {
    return {
      id: this._id,
      propertyId: this.propertyId,
      investmentTypeId: this._investmentTypeId,
      gestion: this._gestion,
      description: this._description,
      balanceQuantity: this._balanceQuantity,
      balanceKilos: this._balanceKilos,
      total: this._total,
      isFinished: this._isFinished,
      isDeleted: this._isDeleted,
      createdAt: this.createdAt,
    };
  }
}
