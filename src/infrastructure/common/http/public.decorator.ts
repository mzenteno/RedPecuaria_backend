import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como pública (no pasa por `JwtAuthGuard`). El guard está
 * registrado global (protege por defecto) — este decorador es la única
 * forma de eximir una ruta, así que un controlador nuevo queda protegido
 * "por accidente" si nadie lo marca explícitamente como público.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
