export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
