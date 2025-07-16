import { isPromise } from "node:util/types"
import { Result } from "@carbonteq/fp/result"
import { Cause, Effect, Either, Option } from "effect"
import type { ParseError } from "effect/ParseResult"
import type { ValidationError } from "./base.errors"
import type { Paginated } from "./pagination.utils"
import {
  parseErrorsToValidationError,
  parseErrorToValidationError,
} from "./valdidation.utils"

export const eitherToResult = <R, L>(e: Either.Either<R, L>): Result<R, L> =>
  Either.match(e, {
    onLeft: Result.Err,
    onRight: Result.Ok,
  })

export const resultToEither = <T, E>(r: Result<T, E>): Either.Either<T, E> =>
  r.isOk() ? Either.right(r.unwrap()) : Either.left(r.unwrapErr())

export const effectToResult = <A, E>(
  effect: Effect.Effect<A, E, never>,
): Result<A, E> => {
  try {
    const exit = Effect.runSyncExit(effect)

    if (exit._tag === "Success") {
      return Result.Ok(exit.value)
    } else {
      if (Cause.isInterrupted(exit.cause)) {
        throw new Error(
          "Cannot run effect synchronously - it contains async operations",
        )
      } else {
        const failureOption = Cause.failureOption(exit.cause)
        if (Option.isSome(failureOption)) {
          return Result.Err(failureOption.value)
        }

        throw Cause.squash(exit.cause)
      }
    }
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "_tag" in error &&
      error._tag === "AsyncFiberException"
    ) {
      throw new Error(
        "Cannot run effect synchronously - it contains async operations",
      )
    }
    throw error
  }
}

export const effectToResultAsync = async <A, E>(
  effect: Effect.Effect<A, E, never>,
): Promise<Result<A, E>> => {
  const either = await Effect.runPromise(Effect.either(effect))
  return eitherToResult(either)
}

export const resultToEffect = <T, E>(
  r: Result<T, E>,
): Effect.Effect<T, E, never> =>
  r.isOk() ? Effect.succeed(r.unwrap()) : Effect.fail(r.unwrapErr())

function mapParseErrors<T>(results: Result<Promise<T>, ParseError>[]): never
function mapParseErrors<T>(
  results: Result<T, ParseError>[],
): Result<T[], ValidationError>
function mapParseErrors<T>(results: Result<T, ParseError>[]) {
  const seq = Result.all(...results)

  return seq.mapErr(parseErrorsToValidationError)
}

type WithSerialize<T> = {
  serialize: () => T
}

type WithSerializeResult<T> = {
  serialize: () => Result<T, ParseError>
}

type WithSerializeAndId<T, Id> = {
  id: Id
  serialize: () => Result<T, ParseError>
}

export const ResultUtils = {
  resultToEither,
  eitherToResult,
  resultToEffect,
  effectToResult,
  effectToResultAsync,
  serialized: <T>(obj: WithSerialize<T>): T => obj.serialize(),

  serializedPreserveId: <T, Id>(
    obj: WithSerializeAndId<T, Id>,
  ): Result<Omit<T, "id"> & { id: Id }, ParseError> =>
    obj.serialize().map((data) => ({ ...data, id: obj.id })),
  encoded: <T>(obj: WithSerializeResult<T>): Result<T, ValidationError> =>
    obj.serialize().mapErr(parseErrorToValidationError),
  pick:
    <T extends Record<string, unknown>, K extends keyof T, E>(...keys: K[]) =>
    (result: Result<T, E>) => {
      return result.map((value) => {
        const picked: Partial<T> = {}
        for (const key of keys) {
          if (key in value) {
            picked[key] = value[key]
          }
        }
        return picked as Pick<T, K>
      })
    },

  extract:
    <T extends Record<string, unknown>, K extends keyof T, E>(key: K) =>
    (result: Result<T, E>): Result<T[K], E> => {
      return result.map((value) => {
        if (key in value) {
          return value[key]
        }
        throw new Error(`Key ${String(key)} not found in result`)
      })
    },

  collectSuccessful: <T, E>(results: Result<T, E>[]): Result<T[], E[]> => {
    const successes: T[] = []
    const errors: E[] = []

    for (const result of results) {
      if (result.isOk()) {
        successes.push(result.unwrap())
      } else {
        errors.push(result.unwrapErr())
      }
    }

    return errors.length === 0 ? Result.Ok(successes) : Result.Err(errors)
  },

  filterOk: <T, E>(results: Result<T, E>[]): T[] => {
    return results.filter((r) => r.isOk()).map((r) => r.unwrap())
  },

  filterErr: <T, E>(results: Result<T, E>[]): E[] => {
    return results.filter((r) => r.isErr()).map((r) => r.unwrapErr())
  },

  log: <T, E>(result: Result<T, E>, prefix: string = "") => {
    if (result.isOk()) {
      console.log(`${prefix} Success:`, result.unwrap())
    } else {
      console.error(`${prefix} Error:`, result.unwrapErr())
    }
  },
  mapParseErrors,

  paginatedSerialize: <T>(r: Paginated<WithSerializeResult<T>>) => {
    const serializedItems = r.items.map((item) => item.serialize())

    return mapParseErrors(serializedItems).map(
      (items) =>
        ({
          ...r,
          items,
        }) satisfies Paginated<T>,
    )
  },
} as const
