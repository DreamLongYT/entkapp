export interface PaginationParams {
  page: number;
  pageSize: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
}

// Unused
export type OffsetPagination = { offset: number; limit: number };
export type InfinitePage<T> = { items: T[]; nextToken: string | null };
