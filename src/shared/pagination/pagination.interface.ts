
export interface PaginationResult<ResultDataType> {
  data: ResultDataType[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

