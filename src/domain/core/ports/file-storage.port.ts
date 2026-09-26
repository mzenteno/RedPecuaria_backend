export const FILE_STORAGE = Symbol('FileStorage');

export interface StoredFileInput {
  buffer: Buffer;
  mimeType: string;
  /** Solo para derivar la extensión del archivo guardado — nunca se
   * conserva el nombre original tal cual (evita colisiones y cualquier
   * caracter raro que traiga el archivo del usuario). */
  originalName: string;
}

/**
 * Guarda archivos subidos por el usuario (hoy: el logo de una empresa) y
 * los sirve de vuelta por una URL pública. La implementación real (disco
 * local, S3, etc.) es un detalle de infraestructura — el dominio/aplicación
 * solo sabe que puede guardar un archivo y borrarlo después.
 */
export interface FileStorage {
  /** Guarda el archivo bajo una carpeta lógica (ej. `"logos"`) y devuelve
   * la URL pública absoluta para servirlo. */
  save(folder: string, file: StoredFileInput): Promise<string>;
  /** Borra un archivo previamente guardado, a partir de la URL que
   * devolvió `save`. Idempotente: no falla si el archivo ya no existe. */
  remove(url: string): Promise<void>;
}
