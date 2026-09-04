/**
 * Contexto transaccional opaco. El dominio/aplicación no conoce su forma real
 * (en infraestructura es un `EntityManager` de TypeORM); solo lo recibe y lo
 * reenvía a los repositorios para que todas las escrituras de un caso de uso
 * ocurran dentro de la misma transacción.
 *
 * Ver regla de transaccionalidad en ARCHITECTURE.md §7: un caso de uso que
 * escribe varias entidades relacionadas (ej. cabecera + detalle) debe hacerlo
 * dentro de una única transacción.
 */
export type TransactionContext = unknown;

export const TRANSACTION_MANAGER = Symbol('TransactionManager');

export interface TransactionManager {
  /**
   * Ejecuta `work` dentro de una transacción. Si `work` lanza, toda la
   * transacción se revierte. El `ctx` recibido debe propagarse a todos los
   * repositorios invocados dentro de `work`.
   */
  run<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
