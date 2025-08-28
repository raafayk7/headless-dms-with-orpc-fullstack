import { Option } from "@carbonteq/fp"
import { DateTime as DT, ParseResult, Schema as S } from "effect"
import type { Brand } from "effect/Brand"
import type { JSONSchema7 } from "json-schema"
import { addMethodsToSchema, createEncoderDecoderBridge } from "./schema-utils"

export const UUIDBase = S.asSchema(
  S.UUID.pipe(S.brand("UUID")).annotations({
    description: "A universally unique identifier (UUID)",
    identifier: "UUID",
    message: (_issue) => "Invalid UUID format",
    jsonSchema: {
      format: "uuid",
      examples: [
        "a211529c-770d-4c71-814a-ff3d11e491ab",
        "27063a98-2a56-4fa9-aaa9-0f35ce10a783",
      ],
    } satisfies JSONSchema7,
  }),
)

export const UUID = addMethodsToSchema(UUIDBase, {
  // Works with chained brands as well
  new: () => crypto.randomUUID() as S.Schema.Type<typeof UUIDBase>,
  extend: <Tag extends string>(tag: Tag) =>
    addMethodsToSchema(UUIDBase.pipe(S.brand(tag)), {
      new: () => crypto.randomUUID() as string & Brand<"UUID"> & Brand<Tag>,
    }),
})

export type UUIDType = S.Schema.Type<typeof UUID>
export type UUIDEncoded = S.Schema.Encoded<typeof UUID>

const DateTimeBase = S.asSchema(
  S.Union(
    S.DateTimeUtcFromDate,
    S.DateTimeUtcFromNumber,
    S.DateTimeUtc,
    S.DateTimeUtcFromSelf,
  ).annotations({
    title: "DateTime",
    description:
      "A date and time value, accepts multiple formats: Unix timestamp (number), ISO string, or Date object",
    identifier: "DateTime",
    message: (_issue) => "Invalid date/time format",
    jsonSchema: {
      oneOf: [
        {
          type: "number",
          format: "timestamp",
          description: "Unix timestamp in milliseconds",
          examples: [1696156800000, Date.now()],
        },
        {
          type: "string",
          format: "date-time",
          description: "ISO 8601 date-time string",
          examples: ["2023-10-01T12:00:00.000Z", "2024-01-15T09:30:00Z"],
        },
      ],
    } satisfies JSONSchema7,
  }),
) as S.Schema<DT.Utc, Date, never> // union type will return first member, which is Date in our case
// we prefer returning Date as it is more common in JavaScript/TypeScript, so easier interop with other libraries

export type DateTimeType = S.Schema.Type<typeof DateTimeBase>
export type DateTimeEncoded = S.Schema.Encoded<typeof DateTimeBase>

export const DateTime = addMethodsToSchema(DateTimeBase, {
  now: () => DT.unsafeNow(),
  bridge: createEncoderDecoderBridge(DateTimeBase),
})

export const Opt = <Inner, Outer, R>(
  schema: S.Schema<Inner, Outer, R>,
): S.Schema<Option<Inner>, Outer | null, R> =>
  S.declare(
    [schema],
    {
      decode: (schema) => (input, parseOptions, _ast) => {
        if (input === null) {
          return ParseResult.succeed(Option.None)
        }

        // At this point, input is not null, so we assume it to be an item that should conform to the schema
        const validated = ParseResult.decodeUnknown(schema)(input, parseOptions)
        return ParseResult.map(validated, Option.Some)
      },
      encode: (schema) => (input, parseOptions, ast) => {
        // Accept an Option only
        if (input instanceof Option) {
          if (input.isNone()) {
            return ParseResult.succeed(null)
          }

          const item = input.unwrap()
          // validate item using schema
          const validated = ParseResult.encodeUnknown(schema)(
            item,
            parseOptions,
          )
          return validated
        }

        const issue = new ParseResult.Type(ast, input)
        return ParseResult.fail(issue)
      },
    },
    {
      description: `Option<${S.format(schema)}> (compatible with @carbonteq/fp)`,
      identifier: "Option",
      default: Option.None,
      jsonSchema: {
        examples: [null, "abc"],
        description: "An optional value that can be null or a valid item",
      } satisfies JSONSchema7,
    },
  )
