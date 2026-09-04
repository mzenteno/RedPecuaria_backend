export const HASH_SERVICE = Symbol('HashService');

/**
 * Hash determinístico (no salteado). Se usa para valores de alta entropía que
 * necesitan buscarse por igualdad de hash — ej. refresh tokens opacos — donde
 * un hash salteado tipo bcrypt no permitiría el lookup. No usar para
 * contraseñas: para eso existe `PasswordHasher`.
 */
export interface HashService {
  sha256(value: string): string;
}
