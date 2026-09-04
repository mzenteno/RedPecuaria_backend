export const TOKEN_GENERATOR = Symbol('TokenGenerator');

/**
 * Payload del access token (JWT). No se persiste — se valida solo con la
 * firma (ver docs/auth-sessions/auth-sessions.md).
 */
export interface AccessTokenPayload {
  sub: string;
  companyId: string;
  /** `undefined` solo puede pasar para un Super Administrador que cambió
   * (`SwitchCompanyUseCase`) a una empresa donde no tiene una fila propia en
   * `user_companies` — no tiene un rol real ahí, y no le hace falta: el
   * permiso por menú se resuelve completo para cualquier Super Admin sin
   * consultar `role_menu_permissions` (ver `GetAuthorizedMenuUseCase`). Para
   * cualquier otro usuario, siempre viene presente. */
  roleId?: string;
  email: string;
  /** Calculado una vez al emitir el token (`UserType.isSuperAdmin()`) — un
   * Super Administrador ve todas las empresas, el resto solo la de esta
   * sesión (ver `ListCompaniesUseCase`). */
  isSuperAdmin: boolean;
}

export interface TokenGenerator {
  generateAccessToken(payload: AccessTokenPayload): string;
  /** Devuelve el payload si la firma y la expiración son válidas, o `null` si no. */
  verifyAccessToken(token: string): AccessTokenPayload | null;
  /**
   * Token opaco de alta entropía para el refresh token — no es un JWT, no
   * lleva payload. Se persiste hasheado (ver `HashService`), nunca en texto
   * plano.
   */
  generateOpaqueToken(): string;
}
