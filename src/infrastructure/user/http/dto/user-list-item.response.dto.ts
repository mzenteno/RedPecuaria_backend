/** Igual criterio que `KardexEntryListItemResponseDto`: forma propia del
 * listado, no un `extends UserResponseDto` — el listado ya no expone
 * `userTypeId` (dato muerto una vez resuelto `userTypeName` acá con JOIN;
 * ver el change de este cambio), mientras que alta/edición (`UserResponseDto`)
 * sí lo siguen devolviendo, porque ahí el frontend lo necesita crudo. */
export class UserListItemResponseDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  userTypeName: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}
