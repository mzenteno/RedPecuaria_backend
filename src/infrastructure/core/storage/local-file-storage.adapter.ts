import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import {
  FileStorage,
  StoredFileInput,
} from '@domain/core/ports/file-storage.port';

const UPLOADS_ROOT_DIR = 'uploads';

/**
 * Guarda archivos en disco local, bajo `<cwd>/uploads/<folder>/` — a
 * propósito FUERA de `src`/`dist` (`process.cwd()`, no `__dirname`): un
 * archivo subido en runtime no puede vivir dentro de `dist`, que se borra y
 * se reconstruye en cada build. Servido de vuelta vía `ServeStaticModule`
 * (`AppModule`), montado en `/uploads` — de ahí que la URL devuelta por
 * `save()` sea siempre absoluta (`APP_BASE_URL` + `/uploads/...`): una ruta
 * relativa la resolvería el FRONTEND contra su propio origen, no el de esta
 * API (dominios distintos, ver `.env.example`).
 *
 * Guardado con un nombre al azar (`randomUUID`), nunca el nombre original
 * del archivo — evita colisiones entre empresas distintas subiendo un
 * archivo con el mismo nombre, y cualquier caracter raro que traiga ese
 * nombre (espacios, acentos, `../`).
 */
@Injectable()
export class LocalFileStorageAdapter implements FileStorage {
  constructor(private readonly config: ConfigService) {}

  async save(folder: string, file: StoredFileInput): Promise<string> {
    const dir = join(process.cwd(), UPLOADS_ROOT_DIR, folder);
    await mkdir(dir, { recursive: true });
    const fileName = `${randomUUID()}${extname(file.originalName)}`;
    await writeFile(join(dir, fileName), file.buffer);
    return `${this.baseUrl()}/${UPLOADS_ROOT_DIR}/${folder}/${fileName}`;
  }

  async remove(url: string): Promise<void> {
    const relativePath = this.toRelativePath(url);
    if (!relativePath) return;
    try {
      await unlink(join(process.cwd(), relativePath));
    } catch {
      // Idempotente a propósito: si ya no existe (o se borró a mano), no
      // es un error — el estado deseado ("no hay archivo ahí") ya se dio.
    }
  }

  private baseUrl(): string {
    return this.config
      .get<string>('APP_BASE_URL', 'http://localhost:3010')
      .replace(/\/+$/, '');
  }

  /** De `"<APP_BASE_URL>/uploads/logos/xxx.png"` a `"uploads/logos/xxx.png"`
   * — lo que hace falta para reconstruir la ruta en disco. `null` si la URL
   * no tiene esa forma (ej. ya se cambió `APP_BASE_URL` o es de otro
   * origen): mejor no borrar nada que borrar el archivo equivocado. */
  private toRelativePath(url: string): string | null {
    const marker = `/${UPLOADS_ROOT_DIR}/`;
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return url.slice(index + 1);
  }
}
