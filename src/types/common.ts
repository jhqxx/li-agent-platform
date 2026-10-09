/** 通用分页参数（对齐 Spring Data 的 page/size 习惯，page 从 0 开始） */
export interface PageQuery {
  page?: number;
  size?: number;
}

/** 通用分页响应 */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
