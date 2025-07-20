import { parseErrorToValidationError } from "@domain/utils/valididation.utils"
import { Schema as S } from "effect"

// Test schema with various validation scenarios
const testSchema = S.Struct({
  // String with length validation
  name: S.String.pipe(S.minLength(3), S.maxLength(20)),

  // Number with range validation
  age: S.Number.pipe(S.int(), S.between(0, 150)),

  // Required boolean
  isActive: S.Boolean,

  // Optional string
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

// Test cases with various error scenarios
const testCases = [
  {
    name: "Multiple validation errors",
    data: {
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
    },
    expected: {
      shouldHaveFields: [
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
      ],
      shouldHaveMessages: true,
      shouldHavePaths: true,
    },
  },
  {
    name: "Missing required fields",
    data: {
      // Missing name, age, isActive, address, tags, birthDate, role
      email: "test@example.com",
    },
    expected: {
      shouldHaveFields: [
        "name",
        "age",
        "isActive",
        "address",
        "tags",
        "birthDate",
        "role",
      ],
      shouldHaveMessages: true,
      shouldHavePaths: true,
    },
  },
  {
    name: "Nested object missing fields",
    data: {
      name: "John",
      age: 25,
      isActive: true,
      address: {
        // Missing street, city, zipCode, country
      },
      tags: ["tag1"],
      birthDate: new Date(),
      role: "user",
    },
    expected: {
      shouldHaveFields: [
        "address.street",
        "address.city",
        "address.zipCode",
        "address.country",
      ],
      shouldHaveMessages: true,
      shouldHavePaths: true,
    },
  },
  {
    name: "Type errors",
    data: {
      name: 123, // Should be string
      age: "not-a-number", // Should be number
      isActive: "yes", // Should be boolean
      address: "not-an-object", // Should be object
      tags: "not-an-array", // Should be array
      birthDate: 123, // Should be date
      role: 456, // Should be string literal
    },
    expected: {
      shouldHaveFields: [
        "name",
        "age",
        "isActive",
        "address",
        "tags",
        "birthDate",
        "role",
      ],
      shouldHaveMessages: true,
      shouldHavePaths: true,
    },
  },
  {
    name: "Array validation errors",
    data: {
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
    },
    expected: {
      shouldHaveFields: ["tags.0", "tags.2"],
      shouldHaveMessages: true,
      shouldHavePaths: true,
    },
  },
]

console.log("=== Testing ParseError to ValidationError Conversion ===\n")

for (const testCase of testCases) {
  console.log(`🧪 Test Case: ${testCase.name}`)
  console.log("Input:", JSON.stringify(testCase.data, null, 2))

  const result = S.decodeUnknownEither(testSchema, {
    errors: "all",
    exact: true,
  })(testCase.data)

  if (result._tag === "Right") {
    console.log("❌ Expected validation errors but got success")
    console.log("---\n")
    continue
  }

  const parseError = result.left
  const validationError = parseErrorToValidationError(parseError)

  console.log(`\n📋 Validation Error Summary:`)
  console.log(`   Message: ${validationError.message}`)
  console.log(`   Issues Count: ${validationError.issues.length}`)

  console.log(`\n📝 Individual Issues:`)
  validationError.issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. Field: ${issue.field || "unknown"}`)
    console.log(`      Message: ${issue.message}`)
    console.log(`      Path: ${issue.path ? issue.path.join(".") : "none"}`)
    console.log(`      Value: ${JSON.stringify(issue.value)}`)
    console.log(
      `      Cause: ${issue.cause ? issue.cause.constructor.name : "none"}`,
    )
    console.log("")
  })

  // Verify expectations
  console.log(`✅ Verification:`)
  const actualFields = validationError.issues
    .map((issue) => issue.field)
    .filter((field) => field !== undefined)
  const missingFields = testCase.expected.shouldHaveFields.filter(
    (field) => !actualFields.includes(field),
  )
  const extraFields = actualFields.filter(
    (field) => !testCase.expected.shouldHaveFields.includes(field),
  )

  if (missingFields.length > 0) {
    console.log(`   ❌ Missing expected fields: ${missingFields.join(", ")}`)
  }

  if (extraFields.length > 0) {
    console.log(`   ⚠️  Extra fields found: ${extraFields.join(", ")}`)
  }

  if (missingFields.length === 0 && extraFields.length === 0) {
    console.log(`   ✅ All expected fields present`)
  }

  const hasMessages = validationError.issues.every(
    (issue) => issue.message && issue.message.length > 0,
  )
  console.log(
    `   ${hasMessages ? "✅" : "❌"} Messages: ${hasMessages ? "Present" : "Missing"}`,
  )

  const hasPaths = validationError.issues.every(
    (issue) => issue.path && issue.path.length > 0,
  )
  console.log(
    `   ${hasPaths ? "✅" : "❌"} Paths: ${hasPaths ? "Present" : "Missing"}`,
  )

  console.log("---\n")
}

console.log("=== Testing Edge Cases ===\n")

// Test with simple validation error
const simpleSchema = S.String.pipe(S.minLength(5))
const simpleResult = S.decodeUnknownEither(simpleSchema, { errors: "all" })(
  "hi",
)

if (simpleResult._tag === "Left") {
  console.log("🧪 Simple String Validation:")
  const simpleError = parseErrorToValidationError(simpleResult.left)
  console.log(`   Message: ${simpleError.message}`)
  console.log(`   Issues: ${simpleError.issues.length}`)
  console.log(`   Field: ${simpleError.issues[0]?.field || "none"}`)
  console.log(`   Path: ${simpleError.issues[0]?.path?.join(".") || "none"}`)
  console.log("")
}

// Test with nested array validation
const nestedArraySchema = S.Struct({
  users: S.Array(
    S.Struct({
      name: S.String.pipe(S.minLength(2)),
      email: S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
    }),
  ),
})

const nestedArrayResult = S.decodeUnknownEither(nestedArraySchema, {
  errors: "all",
})({
  users: [
    { name: "A", email: "invalid" },
    { name: "Valid Name", email: "valid@email.com" },
    { name: "B", email: "also-invalid" },
  ],
})

if (nestedArrayResult._tag === "Left") {
  console.log("🧪 Nested Array Validation:")
  const nestedArrayError = parseErrorToValidationError(nestedArrayResult.left)
  console.log(`   Message: ${nestedArrayError.message}`)
  console.log(`   Issues: ${nestedArrayError.issues.length}`)
  nestedArrayError.issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue.field}: ${issue.message}`)
  })
  console.log("")
}

console.log("=== End of Tests ===")
