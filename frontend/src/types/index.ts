export interface BaseListResult<T> {
  list: T
  pagination: {
    pageNum: number
    pageSize: number
    total: number
  }
}
