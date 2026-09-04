export const PASSWORD_HASHER = Symbol('PasswordHasher');

/**
 * Hashing de contraseñas de usuario (salteado, no determinístico — no sirve
 * para búsquedas por hash). Implementación real: bcrypt.
 */
export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
