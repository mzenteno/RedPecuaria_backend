import { Email } from '../value-objects/email.vo';
import { InvalidUsernameException } from '../exceptions/invalid-username.exception';

export interface UserPersistence {
  id: string | null;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  isDeleted: boolean;
  userTypeId: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export class User {
  private constructor(
    private readonly _id: string | null,
    private _username: string,
    private _email: Email,
    private _passwordHash: string,
    private _fullName: string,
    private _isDeleted: boolean,
    private _userTypeId: string,
    private _lastLoginAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    username: string;
    email: Email;
    passwordHash: string;
    fullName: string;
    userTypeId: string;
  }): User {
    User.validateUsername(props.username);
    return new User(
      null,
      props.username,
      props.email,
      props.passwordHash,
      props.fullName,
      false,
      props.userTypeId,
      null,
      new Date(),
    );
  }

  static fromPersistence(props: UserPersistence & { id: string }): User {
    return new User(
      props.id,
      props.username,
      Email.create(props.email),
      props.passwordHash,
      props.fullName,
      props.isDeleted,
      props.userTypeId,
      props.lastLoginAt,
      props.createdAt,
    );
  }

  get id(): string {
    if (this._id === null) {
      throw new Error('User sin persistir no tiene id todavía');
    }
    return this._id;
  }

  get username(): string {
    return this._username;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get fullName(): string {
    return this._fullName;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get userTypeId(): string {
    return this._userTypeId;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
  }

  deactivate(): void {
    this._isDeleted = true;
  }

  /** No toca `username` ni `password` — esos tienen su propio flujo (no hay
   * "reset de contraseña" todavía, y el username es el identificador de
   * login, no se reasigna desde acá). */
  updateProfile(props: { email: Email; fullName: string }): void {
    this._email = props.email;
    this._fullName = props.fullName;
  }

  changeUserType(userTypeId: string): void {
    this._userTypeId = userTypeId;
  }

  toPersistence(): UserPersistence {
    return {
      id: this._id,
      username: this._username,
      email: this._email.toString(),
      passwordHash: this._passwordHash,
      fullName: this._fullName,
      isDeleted: this._isDeleted,
      userTypeId: this._userTypeId,
      lastLoginAt: this._lastLoginAt,
      createdAt: this.createdAt,
    };
  }

  private static validateUsername(username: string): void {
    if (username.trim().length === 0) {
      throw new InvalidUsernameException();
    }
  }
}
