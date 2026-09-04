/**
 * Categoría semántica de una excepción de dominio. La capa de infraestructura
 * (filtro HTTP) traduce estas categorías a códigos HTTP concretos; el dominio
 * no conoce HTTP.
 */
export enum DomainExceptionCode {
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION = 'VALIDATION',
}

/**
 * Excepción base para todas las excepciones de negocio (domain/application).
 * Nunca representa un error técnico (DB caída, timeout, etc.) — esos se dejan
 * propagar como errores no controlados o se envuelven explícitamente.
 */
export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    public readonly code: DomainExceptionCode,
    /**
     * Datos estructurados adicionales que el cliente necesita para actuar
     * sobre este error (ej. las empresas entre las que puede elegir). El
     * filtro HTTP los reenvía tal cual en la respuesta — el dominio no sabe
     * que existe HTTP, solo expone el dato.
     */
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
