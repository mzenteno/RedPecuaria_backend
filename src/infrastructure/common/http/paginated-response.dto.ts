export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Shape que un controlador devuelve para una lista paginada. `ResponseInterceptor`
 * la reconoce (tiene `data` + `meta`) y la sube al nivel raíz del envoltorio en
 * vez de anidarla bajo `data` — así el body final queda
 * `{ success, statusCode, timestamp, path, data, meta }`.
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;
}
