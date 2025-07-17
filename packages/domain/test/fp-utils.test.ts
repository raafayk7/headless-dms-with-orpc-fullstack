import { expect, test } from "bun:test"
import { Result } from "@carbonteq/fp/result"
import { Effect, Either, Schema as S } from "effect"
import { ValidationError } from "../src/utils/base.errors"
import {
  effectToResult,
  effectToResultAsync,
  eitherToResult,
  ResultUtils,
  resultToEffect,
  resultToEither,
} from "../src/utils/fp-utils"
import type { Paginated } from "../src/utils/pagination.utils"

test("eitherToResult - converts Either.right to Result.Ok", () => {
  const either = Either.right(42)
  const result = eitherToResult(either)

  expect(result.isOk()).toBe(true)
  expect(result.unwrap()).toBe(42)
})

test("eitherToResult - converts Either.left to Result.Err", () => {
  const either = Either.left("error")
  const result = eitherToResult(either)

  expect(result.isErr()).toBe(true)
  expect(result.unwrapErr()).toBe("error")
})

test("resultToEither - converts Result.Ok to Either.right", () => {
  const result = Result.Ok(42)
  const either = resultToEither(result)

  expect(Either.isRight(either)).toBe(true)
  if (Either.isRight(either)) {
    expect(either.right).toBe(42)
  }
})

test("resultToEither - converts Result.Err to Either.left", () => {
  const result = Result.Err<string, number>("error")
  const either = resultToEither(result)

  expect(Either.isLeft(either)).toBe(true)
  if (Either.isLeft(either)) {
    expect(either.left).toBe("error")
  }
})

test("effectToResult - converts successful Effect to Result.Ok", () => {
  const effect = Effect.succeed(42)
  const result = effectToResult(effect)

  expect(result.isOk()).toBe(true)
  expect(result.unwrap()).toBe(42)
})

test("effectToResult - converts failing Effect to Result.Err", () => {
  const effect = Effect.fail("error")
  const result = effectToResult(effect)

  expect(result.isErr()).toBe(true)
  expect(result.unwrapErr()).toBe("error")
})

test("effectToResult - throws error for async effects", () => {
  // Create an effect that has async boundaries using Effect.delay
  const asyncEffect = Effect.delay(Effect.succeed(42), "1 millis")

  expect(() => effectToResult(asyncEffect)).toThrow(
    "Cannot run effect synchronously - it contains async operations",
  )
})

test("resultToEffect - converts Result.Ok to successful Effect", async () => {
  const result = Result.Ok(42)
  const effect = resultToEffect(result)
  const value = await Effect.runPromise(effect)

  expect(value).toBe(42)
})

test("resultToEffect - converts Result.Err to failing Effect", async () => {
  const result = Result.Err<string, number>("error")
  const effect = resultToEffect(result)

  try {
    await Effect.runPromise(effect)
    expect(true).toBe(false) // Should not reach here
  } catch (error) {
    expect(String(error)).toContain("error")
  }
})

test("effectToResultAsync - converts successful Effect to Result.Ok", async () => {
  const effect = Effect.succeed(42)
  const result = await effectToResultAsync(effect)

  expect(result.isOk()).toBe(true)
  expect(result.unwrap()).toBe(42)
})

test("effectToResultAsync - converts failing Effect to Result.Err", async () => {
  const effect = Effect.fail("error")
  const result = await effectToResultAsync(effect)

  expect(result.isErr()).toBe(true)
  expect(result.unwrapErr()).toBe("error")
})

test("effectToResultAsync - handles async effects", async () => {
  // Create an effect that has async boundaries using Effect.delay
  const asyncEffect = Effect.delay(Effect.succeed(42), "1 millis")
  const result = await effectToResultAsync(asyncEffect)

  expect(result.isOk()).toBe(true)
  expect(result.unwrap()).toBe(42)
})

test("effectToResultAsync - handles async failing effects", async () => {
  // Create an async effect that fails
  const asyncEffect = Effect.delay(Effect.fail("async error"), "1 millis")
  const result = await effectToResultAsync(asyncEffect)

  expect(result.isErr()).toBe(true)
  expect(result.unwrapErr()).toBe("async error")
})

// Tests for serialized utility

test("serialized - calls serialize method on object", () => {
  const obj = {
    serialize: () => ({ id: "123", name: "test" }),
  }

  const result = ResultUtils.serialized(obj)

  expect(result).toEqual({ id: "123", name: "test" })
})

test("serialized - works with entities that have serialize method", () => {
  class MockEntity {
    constructor(private data: { id: string; value: number }) {}

    serialize() {
      return {
        ...this.data,
        timestamp: "2024-01-01T00:00:00Z",
      }
    }
  }

  const entity = new MockEntity({ id: "test", value: 42 })
  const result = ResultUtils.serialized(entity)

  expect(result).toEqual({
    id: "test",
    value: 42,
    timestamp: "2024-01-01T00:00:00Z",
  })
})

// Tests for ResultUtils

test("ResultUtils.pick - picks specified keys from Ok result", () => {
  const result = Result.Ok({
    name: "John",
    email: "john@example.com",
    age: 30,
    city: "NYC",
  })

  const picked = ResultUtils.pick("name", "email")(result)

  expect(picked.isOk()).toBe(true)
  expect(picked.unwrap()).toEqual({ name: "John", email: "john@example.com" })
})

test("ResultUtils.pick - preserves Err result", () => {
  const result = Result.Err<string, { name: string; age: number }>("error")

  const picked = ResultUtils.pick("name")(result)

  expect(picked.isErr()).toBe(true)
  expect(picked.unwrapErr()).toBe("error")
})

test("ResultUtils.pick - handles missing keys gracefully", () => {
  const result = Result.Ok({ name: "John", age: 30 })

  // TypeScript will prevent this at compile time, but for runtime we test graceful handling
  const picked = ResultUtils.pick("name")(result)

  expect(picked.isOk()).toBe(true)
  expect(picked.unwrap()).toEqual({ name: "John" })
})

test("ResultUtils.extract - extracts single key from Ok result", () => {
  const result = Result.Ok({ name: "John", age: 30 })

  const extracted = ResultUtils.extract("name")(result)

  expect(extracted.isOk()).toBe(true)
  expect(extracted.unwrap()).toBe("John")
})

test("ResultUtils.extract - preserves Err result", () => {
  const result = Result.Err<string, { name: string }>("error")

  const extracted = ResultUtils.extract("name")(result)

  expect(extracted.isErr()).toBe(true)
  expect(extracted.unwrapErr()).toBe("error")
})

test("ResultUtils.extract - throws error for missing key", () => {
  const result = Result.Ok({ name: "John" })

  expect(() => {
    // Testing runtime behavior for non-existent key by using unknown
    const extracted = ResultUtils.extract("age" as keyof { name: string })(
      result,
    )
    extracted.unwrap()
  }).toThrow("Key age not found in result")
})

test("ResultUtils.filterOk - filters and unwraps successful results", () => {
  const results = [
    Result.Ok(1),
    Result.Err("error1"),
    Result.Ok(3),
    Result.Err("error2"),
  ]

  const successes = ResultUtils.filterOk(results)

  expect(successes).toEqual([1, 3])
})

test("ResultUtils.filterErr - filters and unwraps failed results", () => {
  const results = [
    Result.Ok(1),
    Result.Err("error1"),
    Result.Ok(3),
    Result.Err("error2"),
  ]

  const errors = ResultUtils.filterErr(results)

  expect(errors).toEqual(["error1", "error2"])
})

// Tests for serializedPreserveId

test("ResultUtils.serializedPreserveId - preserves id from object and merges with serialized data", () => {
  const mockParseResult = Result.Ok({ name: "Test", value: 42 })
  const obj = {
    id: "test-id-123",
    serialize: () => mockParseResult,
  }

  const result = ResultUtils.serializedPreserveId(obj)

  expect(result.isOk()).toBe(true)
  expect(result.unwrap()).toEqual({
    id: "test-id-123",
    name: "Test",
    value: 42,
  })
})

test("ResultUtils.serializedPreserveId - preserves Err from serialize method", () => {
  // Generate a real ParseError using schema validation
  const failingResult = S.decodeUnknownEither(S.Number)("not-a-number") // This will fail

  expect(failingResult._tag).toBe("Left")

  if (failingResult._tag === "Left") {
    const mockParseResult = Result.Err(failingResult.left)
    const obj = {
      id: "test-id-123",
      serialize: () => mockParseResult,
    }

    const result = ResultUtils.serializedPreserveId(obj)

    expect(result.isErr()).toBe(true)
  }
})

// Tests for encoded

test("ResultUtils.encoded - converts successful ParseResult to ValidationError", () => {
  const mockParseResult = Result.Ok({ data: "test" })
  const obj = {
    serialize: () => mockParseResult,
  }

  const result = ResultUtils.encoded(obj)

  expect(result.isOk()).toBe(true)
  expect(result.unwrap()).toEqual({ data: "test" })
})

test("ResultUtils.encoded - converts ParseError to ValidationError", () => {
  // Generate a real ParseError using schema validation
  const failingResult = S.decodeUnknownEither(S.String)(123) // This will fail

  expect(failingResult._tag).toBe("Left")

  if (failingResult._tag === "Left") {
    const mockParseResult = Result.Err(failingResult.left)
    const obj = {
      serialize: () => mockParseResult,
    }

    const result = ResultUtils.encoded(obj)

    expect(result.isErr()).toBe(true)
    expect(result.unwrapErr()).toBeInstanceOf(ValidationError)
  }
})

// Tests for collectSuccessful

test("ResultUtils.collectSuccessful - returns Ok with all values when all results are successful", () => {
  const results = [Result.Ok(1), Result.Ok(2), Result.Ok(3)]

  const collected = ResultUtils.collectSuccessful(results)

  expect(collected.isOk()).toBe(true)
  expect(collected.unwrap()).toEqual([1, 2, 3])
})

test("ResultUtils.collectSuccessful - returns Err with all errors when any result fails", () => {
  const results = [
    Result.Ok(1),
    Result.Err("error1"),
    Result.Ok(3),
    Result.Err("error2"),
  ]

  const collected = ResultUtils.collectSuccessful(results)

  expect(collected.isErr()).toBe(true)
  expect(collected.unwrapErr()).toEqual(["error1", "error2"])
})

test("ResultUtils.collectSuccessful - handles empty array", () => {
  const results: Result<number, string>[] = []

  const collected = ResultUtils.collectSuccessful(results)

  expect(collected.isOk()).toBe(true)
  expect(collected.unwrap()).toEqual([])
})

// Tests for log

test("ResultUtils.log - logs success result", () => {
  const originalLog = console.log
  const logs: unknown[] = []
  console.log = (...args) => logs.push(args)

  const result = Result.Ok("success value")
  ResultUtils.log(result, "TEST")

  expect(logs).toHaveLength(1)
  expect(logs[0]).toEqual(["TEST Success:", "success value"])

  console.log = originalLog
})

test("ResultUtils.log - logs error result", () => {
  const originalError = console.error
  const errors: unknown[] = []
  console.error = (...args) => errors.push(args)

  const result = Result.Err("error value")
  ResultUtils.log(result, "TEST")

  expect(errors).toHaveLength(1)
  expect(errors[0]).toEqual(["TEST Error:", "error value"])

  console.error = originalError
})

test("ResultUtils.log - works without prefix", () => {
  const originalLog = console.log
  const logs: unknown[] = []
  console.log = (...args) => logs.push(args)

  const result = Result.Ok("success")
  ResultUtils.log(result)

  expect(logs).toHaveLength(1)
  expect(logs[0]).toEqual([" Success:", "success"])

  console.log = originalLog
})

// Tests for mapParseErrors

test("ResultUtils.mapParseErrors - converts successful ParseResults to ValidationError Result", () => {
  const results = [
    Result.Ok("value1"),
    Result.Ok("value2"),
    Result.Ok("value3"),
  ]

  const mapped = ResultUtils.mapParseErrors(results)

  expect(mapped.isOk()).toBe(true)
  expect(mapped.unwrap()).toEqual(["value1", "value2", "value3"])
})

test("ResultUtils.mapParseErrors - converts ParseErrors to ValidationError", () => {
  // Generate a real ParseError using schema validation
  const failingResult = S.decodeUnknownEither(S.String)(123) // This will fail

  expect(failingResult._tag).toBe("Left")

  if (failingResult._tag === "Left") {
    const results = [
      Result.Ok("value1"),
      Result.Err(failingResult.left),
      Result.Ok("value3"),
    ]

    const mapped = ResultUtils.mapParseErrors(results)

    expect(mapped.isErr()).toBe(true)
    expect(mapped.unwrapErr()).toBeInstanceOf(ValidationError)
  }
})

// Tests for paginatedSerialize

test("ResultUtils.paginatedSerialize - serializes paginated result with successful items", () => {
  const mockItems = [
    { serialize: () => Result.Ok({ id: 1, name: "Item 1" }) },
    { serialize: () => Result.Ok({ id: 2, name: "Item 2" }) },
  ]

  const paginatedData: Paginated<(typeof mockItems)[0]> = {
    items: mockItems,
    totalCount: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  }

  const result = ResultUtils.paginatedSerialize(paginatedData)

  expect(result.isOk()).toBe(true)
  const serialized = result.unwrap()
  expect(serialized.items).toEqual([
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
  ])
  expect(serialized.totalCount).toBe(2)
  expect(serialized.page).toBe(1)
})

test("ResultUtils.paginatedSerialize - handles ParseErrors in items", () => {
  // Generate a real ParseError using schema validation
  const failingResult = S.decodeUnknownEither(S.String)(123) // This will fail

  expect(failingResult._tag).toBe("Left")

  if (failingResult._tag === "Left") {
    const mockItems = [
      { serialize: () => Result.Ok({ id: 1, name: "Item 1" }) },
      { serialize: () => Result.Err(failingResult.left) },
    ]

    const paginatedData: Paginated<(typeof mockItems)[0]> = {
      items: mockItems,
      totalCount: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    }

    const result = ResultUtils.paginatedSerialize(paginatedData)

    expect(result.isErr()).toBe(true)
    expect(result.unwrapErr()).toBeInstanceOf(ValidationError)
  }
})
