import type { Result } from "@carbonteq/fp"
import type { ValidationError } from "@domain/utils/base.errors"
import { eitherToResult } from "@domain/utils/fp-utils"
import { parseErrorToValidationError } from "@domain/utils/valdidation.utils"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import { Schema as S } from "effect"

export const validateWithEffect = <In, Out>(
  schema: S.Schema<Out, In>,
  data: unknown,
) => {
  return eitherToResult(
    S.decodeUnknownEither(schema)(data, {
      errors: "all",
      onExcessProperty: "ignore",
      exact: true,
    }),
  ).mapErr(parseErrorToValidationError)
}

type DtoSchemaInput<T> = {
  create: (data: unknown) => Result<T, ValidationError>
}

export const dtoSchema = <T>(dtoConst: DtoSchemaInput<T>) => {
  return {
    "~standard": {
      vendor: "effect", // to use the same schema converter as effect
      version: 1,
      validate: (data: unknown): StandardSchemaV1.Result<T> => {
        const result = dtoConst.create(data)

        if (result.isOk())
          return {
            value: result.unwrap(),
          } satisfies StandardSchemaV1.SuccessResult<T>

        const err = result.unwrapErr()
        const issues = err.issues.map(
          (issue) =>
            ({
              message: issue.message,
              path: issue.path,
            }) satisfies StandardSchemaV1.Issue,
        )

        return { issues } satisfies StandardSchemaV1.FailureResult
      },
    },
  } satisfies StandardSchemaV1<unknown, T>
}
