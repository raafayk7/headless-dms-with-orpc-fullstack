import { Schema as S } from "effect"

export const PaginationParamsSchema = S.Struct({
  page: S.optional(S.Number.pipe(S.positive())),
  limit: S.optional(S.Number.pipe(S.positive(), S.lessThanOrEqualTo(100))),
  sortBy: S.optional(S.String),
  sortOrder: S.optional(S.Union(S.Literal("asc"), S.Literal("desc"))),
})

export type PaginationParams = S.Schema.Type<typeof PaginationParamsSchema>

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
export const DEFAULT_SORT_ORDER = "asc" as const

export const PaginatedResultSchema = <A, I>(
  itemSchema: S.Schema<A, I, never>,
) =>
  S.asSchema(
    S.Struct({
      items: S.Array(itemSchema),
      totalCount: S.Number,
      page: S.Number,
      limit: S.Number,
      totalPages: S.Number,
      hasNext: S.Boolean,
      hasPrevious: S.Boolean,
    }),
  )

export type Paginated<T> = {
  items: T[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

const getDefaultPagination = (params?: Partial<PaginationParams>) => {
  return {
    page: params?.page ?? DEFAULT_PAGE,
    limit: params?.limit ?? DEFAULT_LIMIT,
    sortOrder: params?.sortOrder ?? DEFAULT_SORT_ORDER,
  }
}

const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit
}

const createPaginatedResult = <T>(
  items: T[],
  totalCount: number,
  page: number,
  limit: number,
): Paginated<T> => {
  const totalPages = Math.ceil(totalCount / limit)

  return {
    items,
    totalCount,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  }
}

export const PaginationUtils = {
  calculateOffset,
  getDefaultPagination,
  createPaginatedResult,
} as const
