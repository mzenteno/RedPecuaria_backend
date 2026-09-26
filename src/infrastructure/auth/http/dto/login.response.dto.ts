export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: string;
  companyId: string;
  /** Ausente en la respuesta de `switch-company` cuando el Super
   * Administrador no tiene una fila propia en la empresa elegida, y también
   * en un login directo de un Super Administrador sin ninguna fila en
   * `user_companies` (2026-09-25, ver `LoginUseCase`) — ver
   * `AccessTokenPayload.roleId`. Para cualquier otro usuario, siempre
   * viene presente. */
  roleId?: string;
}
