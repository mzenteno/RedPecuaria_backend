import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainException,
  DomainExceptionCode,
} from '@domain/common/domain.exception';

const STATUS_BY_CODE: Record<DomainExceptionCode, HttpStatus> = {
  [DomainExceptionCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainExceptionCode.CONFLICT]: HttpStatus.CONFLICT,
  [DomainExceptionCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [DomainExceptionCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [DomainExceptionCode.VALIDATION]: HttpStatus.UNPROCESSABLE_ENTITY,
};

interface ResolvedError {
  status: number;
  error: string;
  message: string | string[];
  details?: Record<string, unknown>;
}

/**
 * Traduce CUALQUIER excepción no atrapada — de dominio, de Nest (ej.
 * `ValidationPipe`), o un error técnico no controlado — a la misma forma de
 * respuesta que usa toda la API (ver `ResponseInterceptor` para el camino
 * feliz): `{ success, statusCode, timestamp, path, error, message }`. Es el
 * único lugar donde una excepción se traduce a HTTP — los controladores no
 * deben hacer try/catch para esto (ver ARCHITECTURE.md §6).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, error, message, details } = this.resolve(exception);

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
      ...(details ? { details } : {}),
    });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof DomainException) {
      return {
        status:
          STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR,
        error: exception.name,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { status, error: exception.name, message: body };
      }
      const bodyObj = body as { error?: string; message?: string | string[] };
      return {
        status,
        error: bodyObj.error ?? exception.name,
        message: bodyObj.message ?? exception.message,
      };
    }

    // Error no controlado (bug, falla técnica): no se filtran detalles
    // internos al cliente, pero sí se deja rastro en los logs del servidor.
    console.error('Error no controlado:', exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Ocurrió un error inesperado',
    };
  }
}
