export interface RefreshTokenPersistence {
  id: string | null;
  userId: string;
  companyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class RefreshToken {
  private constructor(
    private readonly _id: string | null,
    public readonly userId: string,
    public readonly companyId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    private _revokedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    userId: string;
    companyId: string;
    tokenHash: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      null,
      props.userId,
      props.companyId,
      props.tokenHash,
      props.expiresAt,
      null,
      new Date(),
    );
  }

  static fromPersistence(
    props: RefreshTokenPersistence & { id: string },
  ): RefreshToken {
    return new RefreshToken(
      props.id,
      props.userId,
      props.companyId,
      props.tokenHash,
      props.expiresAt,
      props.revokedAt,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('RefreshToken sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  /** Válido = ni revocado ni expirado. Es la única condición para poder usarlo en un refresh. */
  isValid(): boolean {
    return !this.isRevoked() && !this.isExpired();
  }

  revoke(): void {
    this._revokedAt = new Date();
  }

  toPersistence(): RefreshTokenPersistence {
    return {
      id: this._id,
      userId: this.userId,
      companyId: this.companyId,
      tokenHash: this.tokenHash,
      expiresAt: this.expiresAt,
      revokedAt: this._revokedAt,
      createdAt: this.createdAt,
    };
  }
}
