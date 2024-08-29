export type PageInfo<T> = {
  data: T[]
  total: number
}

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
