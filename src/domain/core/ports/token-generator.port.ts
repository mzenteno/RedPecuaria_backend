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
  /** Copiados del `User` al emitir el token — si cambian, se ven recién en
   * el próximo login/refresh (mismo criterio que `isSuperAdmin`, ver
   * abajo). `username` es el identificador de login (`User.username`, ver
   * docs/user/user.md); `fullName` es el nombre real de la persona. */
  username: string;
  fullName: string;
  /** Calculado una vez al emitir el token (`UserType.isSuperAdmin()`) — un
   * Super Administrador ve todas las empresas, el resto solo la de esta
   * sesión (ver `ListCompaniesUseCase`). */
  isSuperAdmin: boolean;
  /** Calculado una vez al emitir el token (`UserType.isInvestor()`), mismo
   * criterio que `isSuperAdmin` — el frontend lo usa para elegir qué
   * dashboard mostrar (ver `docs/dashboard/dashboard.md`). Mutuamente
   * excluyente con `isSuperAdmin`: todo usuario tiene exactamente un
   * `UserType` (ver `docs/user-type/user-type.md`). */
  isInvestor: boolean;
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
