import { describe, expect, test } from "bun:test"
import { Schema as S } from "effect"
import { convertEffectSchemaToOpenAPI } from "../../effect-schema-converter"

describe("Union Type Deduplication", () => {
  test("should deduplicate unions with similar number types", () => {
    // Create a union with multiple number-like types
    const schema = S.Union(
      S.Number,
      S.Number.pipe(S.int()),
      S.Number.pipe(S.positive()),
      S.String,
    )

    const result = convertEffectSchemaToOpenAPI(schema)

    expect(result.oneOf).toHaveLength(2) // Should only have number and string
    expect(result.oneOf?.[0]?.type).toBe("number")
    expect(result.oneOf?.[1]?.type).toBe("string")
  })

  test("should deduplicate unions with similar string types", () => {
    const schema = S.Union(
      S.String,
      S.String.pipe(S.minLength(1)),
      S.String.pipe(S.maxLength(100)),
      S.Number,
    )

    const result = convertEffectSchemaToOpenAPI(schema)

    expect(result.oneOf).toHaveLength(2) // Should only have string and number
    expect(result.oneOf?.[0]?.type).toBe("string")
    expect(result.oneOf?.[1]?.type).toBe("number")
  })

  test("should preserve different core types", () => {
    const schema = S.Union(S.String, S.Number, S.Boolean, S.Array(S.String))

    const result = convertEffectSchemaToOpenAPI(schema)

    expect(result.oneOf).toHaveLength(4) // All different core types
    // @ts-expect-error bad types
    const types = result.oneOf?.map((item) => item.type) || []
    expect(types).toEqual(["string", "number", "boolean", "array"])
  })

  test("should handle object types with different properties", () => {
    const schema = S.Union(
      S.Struct({ name: S.String }),
      S.Struct({ age: S.Number }),
      S.String,
    )

    const result = convertEffectSchemaToOpenAPI(schema)

    expect(result.oneOf).toHaveLength(3) // Two different objects + string
    expect(result.oneOf?.[0]?.type).toBe("object")
    expect(result.oneOf?.[1]?.type).toBe("object")
    expect(result.oneOf?.[2]?.type).toBe("string")
  })
})
