import { describe, expect, test } from "bun:test"
import { parseErrorToValidationError } from "@domain/utils/validation.utils"
import { Schema as S } from "effect"

describe("ParseError to ValidationError Conversion", () => {
  // Test schema with various validation scenarios
  const testSchema = S.Struct({
    // String with length validation
    name: S.String.pipe(S.minLength(3), S.maxLength(20)),

    // Number with range validation
    age: S.Number.pipe(S.int(), S.between(0, 150)),

    // Required boolean
    isActive: S.Boolean,

    // Optional string with pattern
    email: S.optional(S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))),

    // Nested object
    address: S.Struct({
      street: S.String.pipe(S.minLength(1)),
      city: S.String.pipe(S.minLength(2)),
      zipCode: S.String.pipe(S.pattern(/^\d{5}$/)),
      country: S.String.pipe(S.minLength(2)),
    }),

    // Array validation
    tags: S.Array(S.String.pipe(S.minLength(1))),

    // Date validation
    birthDate: S.Date,

    // Union type
    role: S.Union(S.Literal("admin"), S.Literal("user"), S.Literal("guest")),
  })

  test("Multiple validation errors", () => {
    const data = {
      name: "Jo", // Too short
      age: 200, // Too high
      isActive: "not-boolean", // Wrong type
      email: "invalid-email", // Invalid format
      address: {
        street: "", // Too short
        city: "A", // Too short
        zipCode: "123", // Invalid format
        country: "X", // Too short
      },
      tags: ["", "valid-tag"], // Empty string in array
      birthDate: "invalid-date", // Invalid date
      role: "invalid-role", // Invalid union value
    }

    const expectedFields = [
      "name",
      "age",
      "isActive",
      "email",
      "address.street",
      "address.city",
      "address.zipCode",
      "address.country",
      "tags.0",
      "birthDate",
      "role",
    ]

    const result = S.decodeUnknownEither(testSchema, {
      errors: "all",
      exact: true,
    })(data)

    expect(result._tag).toBe("Left")

    if (result._tag === "Left") {
      const validationError = parseErrorToValidationError(result.left)

      expect(validationError.issues.length).toBeGreaterThan(1)

      const actualFields = validationError.issues
        .map((issue) => issue.field)
        .filter(Boolean) as string[]

      // Check that we have proper field names
      expectedFields.forEach((field) => {
        expect(actualFields).toContain(field)
      })

      // Check that each issue has a message
      validationError.issues.forEach((issue) => {
        expect(issue.message).toBeDefined()
        expect(issue.message.length).toBeGreaterThan(0)
      })

      // Check that each issue has a path
      validationError.issues.forEach((issue) => {
        expect(issue.path).toBeDefined()
        expect(issue.path?.length).toBeGreaterThan(0)
      })
    }
  })

  test("Missing required fields", () => {
    const data = {
      // Missing name, age, isActive, address, tags, birthDate, role
      email: "test@example.com",
    }

    const expectedFields = [
      "name",
      "age",
      "isActive",
      "address",
      "tags",
      "birthDate",
      "role",
    ]

    const result = S.decodeUnknownEither(testSchema, {
      errors: "all",
      exact: true,
    })(data)

    expect(result._tag).toBe("Left")

    if (result._tag === "Left") {
      const validationError = parseErrorToValidationError(result.left)

      expect(validationError.issues.length).toBeGreaterThan(1)

      const actualFields = validationError.issues
        .map((issue) => issue.field)
        .filter(Boolean) as string[]

      expectedFields.forEach((field) => {
        expect(actualFields).toContain(field)
      })
    }
  })

  test("Nested object missing fields", () => {
    const data = {
      name: "John",
      age: 25,
      isActive: true,
      address: {
        // Missing street, city, zipCode, country
      },
      tags: ["tag1"],
      birthDate: new Date(),
      role: "user",
    }

    const expectedFields = [
      "address.street",
      "address.city",
      "address.zipCode",
      "address.country",
    ]

    const result = S.decodeUnknownEither(testSchema, {
      errors: "all",
      exact: true,
    })(data)

    expect(result._tag).toBe("Left")

    if (result._tag === "Left") {
      const validationError = parseErrorToValidationError(result.left)

      const actualFields = validationError.issues
        .map((issue) => issue.field)
        .filter(Boolean) as string[]

      expectedFields.forEach((field) => {
        expect(actualFields).toContain(field)
      })
    }
  })

  test("Type errors", () => {
    const data = {
      name: 123, // Should be string
      age: "not-a-number", // Should be number
      isActive: "yes", // Should be boolean
      address: "not-an-object", // Should be object
      tags: "not-an-array", // Should be array
      birthDate: 123, // Should be date
      role: 456, // Should be string literal
    }

    const expectedFields = [
      "name",
      "age",
      "isActive",
      "address",
      "tags",
      "birthDate",
      "role",
    ]

    const result = S.decodeUnknownEither(testSchema, {
      errors: "all",
      exact: true,
    })(data)

    expect(result._tag).toBe("Left")

    if (result._tag === "Left") {
      const validationError = parseErrorToValidationError(result.left)

      const actualFields = validationError.issues
        .map((issue) => issue.field)
        .filter(Boolean) as string[]

      expectedFields.forEach((field) => {
        expect(actualFields).toContain(field)
      })
    }
  })

  test("Array validation errors", () => {
    const data = {
      name: "John",
      age: 25,
      isActive: true,
      address: {
        street: "123 Main St",
        city: "Anytown",
        zipCode: "12345",
        country: "US",
      },
      tags: ["", "valid", "", "also-valid"], // Empty strings should fail
      birthDate: new Date(),
      role: "user",
    }

    const expectedFields = ["tags.0", "tags.2"]

    const result = S.decodeUnknownEither(testSchema, {
      errors: "all",
      exact: true,
    })(data)

    expect(result._tag).toBe("Left")

    if (result._tag === "Left") {
      const validationError = parseErrorToValidationError(result.left)

      const actualFields = validationError.issues
        .map((issue) => issue.field)
        .filter(Boolean) as string[]

      expectedFields.forEach((field) => {
        expect(actualFields).toContain(field)
      })
    }
  })

  describe("Edge Cases", () => {
    test("Simple string validation", () => {
      const simpleSchema = S.String.pipe(S.minLength(5))
      const result = S.decodeUnknownEither(simpleSchema, { errors: "all" })(
        "hi",
      )

      expect(result._tag).toBe("Left")

      if (result._tag === "Left") {
        const validationError = parseErrorToValidationError(result.left)

        expect(validationError.issues.length).toBeGreaterThan(0)
        const issue = validationError.issues[0]
        expect(issue?.message).toBeDefined()
        expect(issue?.message).toBe(
          "Expected a string at least 5 character(s) long, got 'hi'",
        )
      }
    })

    test("Nested array validation", () => {
      const nestedArraySchema = S.Struct({
        users: S.Array(
          S.Struct({
            name: S.String.pipe(S.minLength(2)),
            email: S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
          }),
        ),
      })

      const result = S.decodeUnknownEither(nestedArraySchema, {
        errors: "all",
      })({
        users: [
          { name: "A", email: "invalid" },
          { name: "Valid Name", email: "valid@email.com" },
          { name: "B", email: "also-invalid" },
        ],
      })

      expect(result._tag).toBe("Left")

      if (result._tag === "Left") {
        const validationError = parseErrorToValidationError(result.left)

        expect(validationError.issues.length).toBeGreaterThan(0)

        const actualFields = validationError.issues
          .map((issue) => issue.field)
          .filter(Boolean) as string[]

        // Should have fields like "users.0.name", "users.0.email", "users.2.name", "users.2.email"
        expect(actualFields.some((field) => field.includes("users.0"))).toBe(
          true,
        )
        expect(actualFields.some((field) => field.includes("users.2"))).toBe(
          true,
        )
      }
    })

    test("Refinement validation", () => {
      const refinementSchema = S.String.pipe(S.minLength(3), S.maxLength(10))
      const result = S.decodeUnknownEither(refinementSchema, {
        errors: "all",
      })("ab")

      expect(result._tag).toBe("Left")

      if (result._tag === "Left") {
        const validationError = parseErrorToValidationError(result.left)

        expect(validationError.issues.length).toBeGreaterThan(0)
        expect(validationError.issues[0]?.message).toBeDefined()
        expect(validationError.issues[0]?.message.length).toBeGreaterThan(0)
      }
    })

    test("Union validation", () => {
      const unionSchema = S.Union(
        S.Literal("A"),
        S.Literal("B"),
        S.Literal("C"),
      )
      const result = S.decodeUnknownEither(unionSchema, { errors: "all" })("D")

      expect(result._tag).toBe("Left")

      if (result._tag === "Left") {
        const validationError = parseErrorToValidationError(result.left)

        expect(validationError.issues.length).toBeGreaterThan(0)
        expect(validationError.issues[0]?.message).toBeDefined()
        expect(validationError.issues[0]?.message.length).toBeGreaterThan(0)
      }
    })
  })
})
