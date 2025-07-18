import type { Result } from "@carbonteq/fp"
import { FpUtils, ValidationError } from "@domain/utils"

type EntityMapper<T, U> = (data: T) => Result<U, ValidationError>

export const enhanceEntityMapper = <T, U, E>(fn: EntityMapper<T, U>) => {
  const mapOne = (data: T): Result<U, ValidationError> => fn(data)

  const mapMany = (data: T[]): Result<U[], ValidationError> => {
    const entities = data.map(fn)

    return FpUtils.collectValidationErrors(entities)
  }

  return { mapOne, mapMany } as const
}
