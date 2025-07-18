import type { Result } from "@carbonteq/fp"
import type { ValidationError } from "@domain/utils/base.errors"
import { eitherToResult } from "@domain/utils/fp-utils"
import { parseErrorToValidationError } from "@domain/utils/valididation.utils"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import { Schema as S } from "effect"
import type { AST } from "effect/SchemaAST"

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

type DtoSchemaInput<T, Out, In, Ctx> = {
  schema: S.Schema<Out, In, Ctx>
  create: (data: unknown) => Result<T, ValidationError>
}

type DtoSchemaOutput<T, In> = StandardSchemaV1<In, T> & {
  ast: AST
}

type TSimpleDto<_Name extends string, Dto> = Dto

// Ensures that DTOs are only created through the static `create` method, also prevents bypassing validation via subclassing
const RuntimeValidationToken = Symbol.for("EnsureValidationThroughCreation")

export const simpleSchemaDto = <Name extends string, A, I>(
  className: Name,
  schema: S.Schema<A, I, never>,
) => {
  class SimpleDto {
    static readonly schema = schema

    protected constructor(
      readonly data: A,
      token: typeof RuntimeValidationToken,
    ) {
      if (token !== RuntimeValidationToken) {
        throw new Error(
          "SimpleDto should only be instantiated through the static create method.",
        )
      }
    }

    static create(
      input: unknown,
    ): Result<TSimpleDto<Name, SimpleDto>, ValidationError> {
      return validateWithEffect(schema, input).map(
        // biome-ignore lint/complexity/noThisInStatic: Intentional factory
        (validatedData) => new this(validatedData, RuntimeValidationToken),
      )
    }
  }

  if (className) {
    Object.defineProperty(SimpleDto, "name", { value: className })
  }

  return SimpleDto
}

export const dtoStandardSchema = <T, Out, In, Ctx>(
  dtoConst: DtoSchemaInput<T, Out, In, Ctx>,
): DtoSchemaOutput<T, In> => {
  return {
    ast: dtoConst.schema.ast,
    "~standard": {
      vendor: "effect",
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
    } satisfies StandardSchemaV1.Props<In, T>,
  }
}
