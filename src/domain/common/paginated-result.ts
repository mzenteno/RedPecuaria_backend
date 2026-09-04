/** Contrato compartido para cualquier repositorio que liste con paginación. */
export interface PaginationParams {
  page: number;
  pageSize: number;
  /** Búsqueda de texto libre — cada repositorio decide en qué columnas
   * (ver `UserRepositoryAdapter.findAllPaginated`). Opcional: no todo
   * listado paginado necesita búsqueda. */
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
