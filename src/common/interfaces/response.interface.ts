export interface ApiResponse<Data> {
  code: number;
  message: string;
  data: Data;
}

export interface PaginatedApiResponse<T> {
  code: number;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}
