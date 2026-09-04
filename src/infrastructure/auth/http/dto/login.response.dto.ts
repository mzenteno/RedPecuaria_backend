export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: string;
  companyId: string;
  /** Ausente solo en la respuesta de `switch-company` cuando el Super
   * Administrador no tiene una fila propia en la empresa elegida — ver
   * `AccessTokenPayload.roleId`. Un login normal siempre lo trae. */
  roleId?: string;
}
