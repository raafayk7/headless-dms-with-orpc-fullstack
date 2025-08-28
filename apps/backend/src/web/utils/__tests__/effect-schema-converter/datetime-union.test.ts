import { describe, expect, test } from "bun:test"
import { DateTime } from "@repo/domain"
import { convertEffectSchemaToOpenAPI } from "../../effect-schema-converter"

describe("DateTime Union Deduplication", () => {
  test("should normalize DateTime union to only first number and string types", () => {
    const result = convertEffectSchemaToOpenAPI(DateTime)

    expect(result).toEqual({
      oneOf: [
        {
          type: "number",
          format: "timestamp",
          description: "a Date to be decoded into a DateTime.Utc",
        },
        {
          type: "string",
          description: "a string to be decoded into a DateTime.Utc",
        },
      ],
      title: "DateTime",
      description:
        "A date and time value, accepts multiple formats: Unix timestamp (number), ISO string, or Date object",
    })

    expect(result.oneOf).toHaveLength(2)

    // @ts-expect-error bad types
    const types = result.oneOf?.map((item) => item.type) || []
    expect(types).toEqual(["number", "string"])
  })
})
