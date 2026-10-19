import { InsufficientInvestorBalanceException } from '../exceptions/insufficient-investor-balance.exception';
import { InvestorInvestmentFinishedException } from '../exceptions/investor-investment-finished.exception';
import { InvestmentBalanceDelta } from './investment';

export interface InvestmentInvestorPersistence {
  id: string | null;
  investmentId: string;
  userId: string;
  balanceQuantity: number;
  balanceKilos: number;
  total: number;
  /** "Terminada" por inversionista (desde 2026-10-19) — lo marca el usuario
   * a mano desde el Kardex de ese inversionista. Mientras esté en `true` su
   * saldo no se puede mover (ver `applyBalanceDelta`). */
  isFinished: boolean;
  createdAt: Date;
}

/**
 * El vínculo entre una `Investment` y uno de sus inversionistas — además de
 * la pertenencia (quién participa, ver `InvestmentRepository.findInvestorIds`/
 * `replaceInvestors`), ahora lleva su PROPIO saldo vigente (a pedido del
 * usuario, 2026-10-14: cada movimiento de kardex queda atado a un
 * inversionista puntual, no solo a la inversión en general).
 *
 * Mismo criterio exacto que `Investment.applyBalanceDelta` (mismo delta,
 * mismo piso en 0 solo para `balanceQuantity`) — se mantiene DUPLICADO del
 * agregado de `Investment` a propósito: `Investment.balanceQuantity`/
 * `balanceKilos`/`total` sigue siendo el total de la inversión (suma de
 * todos sus inversionistas), mientras que esta entidad es el saldo de UNO
 * puntual. Ambos se actualizan en la misma transacción que crea/edita/
 * desactiva un `KardexEntry` (ver `CreateKardexEntryUseCase` y afines).
 */
export class InvestmentInvestor {
  private constructor(
    private readonly _id: string | null,
    public readonly investmentId: string,
    public readonly userId: string,
    private _balanceQuantity: number,
    private _balanceKilos: number,
    private _total: number,
    private _isFinished: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    investmentId: string;
    userId: string;
  }): InvestmentInvestor {
    return new InvestmentInvestor(
      null,
      props.investmentId,
      props.userId,
      0,
      0,
      0,
      false,
      new Date(),
    );
  }

  static fromPersistence(
    props: InvestmentInvestorPersistence & { id: string },
  ): InvestmentInvestor {
    return new InvestmentInvestor(
      props.id,
      props.investmentId,
      props.userId,
      props.balanceQuantity,
      props.balanceKilos,
      props.total,
      props.isFinished,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('InvestmentInvestor sin persistir no tiene id todavía');
    }
    return this._id;
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

  /** Elección manual (botón "Finalizar"/"Reactivar" del Kardex) — no se
   * valida contra el saldo, igual que lo era `Investment.isFinished` antes
   * de pasar a ser por inversionista. */
  setFinished(isFinished: boolean): void {
    this._isFinished = isFinished;
  }

  /** Ver `Investment.applyBalanceDelta` — mismo criterio exacto, piso en 0
   * solo para `balanceQuantity`. Además, un inversionista terminado no
   * admite ningún movimiento (alta, edición o baja de un `KardexEntry`
   * pasan todos por acá): su Kardex queda de solo lectura hasta que se lo
   * reactive. */
  applyBalanceDelta(delta: InvestmentBalanceDelta): void {
    if (this._isFinished) {
      throw new InvestorInvestmentFinishedException(
        this.investmentId,
        this.userId,
      );
    }
    const newBalanceQuantity = this._balanceQuantity + delta.quantity;
    if (newBalanceQuantity < 0) {
      throw new InsufficientInvestorBalanceException(
        this.investmentId,
        this.userId,
      );
    }
    this._balanceQuantity = newBalanceQuantity;
    this._balanceKilos = this._balanceKilos + delta.kilos;
    this._total = this._total + delta.total;
  }

  toPersistence(): InvestmentInvestorPersistence {
    return {
      id: this._id,
      investmentId: this.investmentId,
      userId: this.userId,
      balanceQuantity: this._balanceQuantity,
      balanceKilos: this._balanceKilos,
      total: this._total,
      isFinished: this._isFinished,
      createdAt: this.createdAt,
    };
  }
}
