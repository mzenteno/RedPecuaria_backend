import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponseDto } from './paginated-response.dto';

export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface PaginatedSuccessResponse<T> extends SuccessResponse<T[]> {
  meta: PaginatedResponseDto<T>['meta'];
}

function isPaginatedResponse(
  value: unknown,
): value is PaginatedResponseDto<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Array.isArray((value as PaginatedResponseDto<unknown>).data) &&
    'meta' in value
  );
}

/**
 * Envuelve toda respuesta exitosa en la misma forma que usa toda la API (ver
 * `GlobalExceptionFilter` para el camino de error):
 * `{ success, statusCode, timestamp, path, data }`. Un 204 (sin body, ej.
 * logout) se deja pasar sin envolver — un 204 no debe llevar body.
 *
 * Si el controlador devuelve un `PaginatedResponseDto` (`{ data, meta }`), el
 * `meta` se sube al nivel raíz del envoltorio en vez de anidarlo bajo `data`
 * (ver `paginated-response.dto.ts`).
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T> | PaginatedSuccessResponse<T> | undefined
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T> | PaginatedSuccessResponse<T> | undefined> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((result) => {
        if (response.statusCode === Number(HttpStatus.NO_CONTENT)) {
          return undefined;
        }

        const base = {
          success: true as const,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (isPaginatedResponse(result)) {
          return {
            ...base,
            data: result.data,
            meta: result.meta,
          } as PaginatedSuccessResponse<T>;
        }

        return { ...base, data: result };
      }),
    );
  }
}
