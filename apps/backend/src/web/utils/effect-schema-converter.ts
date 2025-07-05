import type { AnySchema } from "@orpc/contract"
import type {
  ConditionalSchemaConverter,
  JSONSchema as OrpcOpenAPIJSONSchema,
  SchemaConvertOptions,
} from "@orpc/openapi"
import type { OpenAPIV3_1 } from "@scalar/openapi-types"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import { Schema as S } from "effect"
import type { AST } from "effect/SchemaAST"

type SchemaObject = OpenAPIV3_1.SchemaObject

// Helper to cast Effect's untyped AST to any for property access
// biome-ignore lint/suspicious/noExplicitAny: Effect Schema AST is untyped
const toAst = (ast: unknown) => ast as any

interface SchemaVisitContext {
  visited: Set<AST>
  depth: number
}

export function convertEffectSchemaToOpenAPI<In, Out>(
  schema: S.Schema<Out, In, never>,
): SchemaObject {
  const context: SchemaVisitContext = {
    visited: new Set(),
    depth: 0,
  }

  // preserve refinements up to the first transformation - https://effect.website/docs/schema/projections/#encodedboundschema
  const simplifiedSchema = S.encodedBoundSchema(schema)

  return convertAST(simplifiedSchema.ast, context)
}

function convertAST(ast: AST, context: SchemaVisitContext): SchemaObject {
  // Prevent infinite recursion for circular references
  if (context.visited.has(ast)) {
    return { type: "object" } // Return a simple object reference
  }

  if (context.depth > 10) {
    throw new Error("Maximum schema depth exceeded")
  }

  context.visited.add(ast)
  context.depth++

  try {
    const result = convertASTNode(ast, context)

    // Add annotations if present
    const annotations = extractAnnotations(ast)
    if (annotations) {
      Object.assign(result, annotations)
    }

    return result
  } finally {
    context.visited.delete(ast)
    context.depth--
  }
}

function convertASTNode(ast: AST, context: SchemaVisitContext): SchemaObject {
  switch (ast._tag) {
    case "StringKeyword":
      return { type: "string" }
    case "NumberKeyword":
      return { type: "number" }
    case "BooleanKeyword":
      return { type: "boolean" }
    case "VoidKeyword":
      return { type: "null" }
    case "UndefinedKeyword":
      return {} as SchemaObject
    case "Literal":
      return convertLiteral(ast)
    case "TypeLiteral":
      return convertTypeLiteral(ast, context)
    case "TupleType":
      return convertTuple(ast, context)
    case "Union":
      return convertUnion(ast, context)
    case "Refinement":
      return convertRefinement(ast, context)
    case "Suspend":
      return convertSuspend(ast, context)
    case "Declaration":
      return {}
    default:
      throw new Error(`Unsupported AST node type: ${ast._tag}`)
  }
}

function convertLiteral(ast: unknown): SchemaObject {
  const astObj = toAst(ast)
  const value = astObj.literal

  // Special case for null
  if (value === null) {
    return { type: "null" }
  }

  if (typeof value === "string") {
    return { type: "string", enum: [value] }
  } else if (typeof value === "number") {
    return { type: "number", enum: [value] }
  } else if (typeof value === "boolean") {
    return { type: "boolean", enum: [value] }
  }

  return { const: value }
}

function convertTypeLiteral(
  ast: unknown,
  context: SchemaVisitContext,
): SchemaObject {
  const astObj = toAst(ast)
  const result: SchemaObject = {
    type: "object",
  }

  // Handle index signatures first (records)
  if (astObj.indexSignatures && astObj.indexSignatures.length > 0) {
    const indexSig = astObj.indexSignatures[0]
    result.additionalProperties = convertAST(indexSig.type, context)
  }

  // Handle object types with properties
  if (astObj.propertySignatures && astObj.propertySignatures.length > 0) {
    result.properties = {}
    result.required = []

    for (const prop of astObj.propertySignatures) {
      // Handle optional fields with Union types (Type | undefined)
      if (
        prop.isOptional &&
        prop.type._tag === "Union" &&
        prop.type.types.length === 2 &&
        prop.type.types.some(
          (t: unknown) => toAst(t)._tag === "UndefinedKeyword",
        )
      ) {
        // Extract the non-undefined type
        const nonUndefinedType = prop.type.types.find(
          (t: unknown) => toAst(t)._tag !== "UndefinedKeyword",
        )
        if (result.properties && nonUndefinedType) {
          result.properties[prop.name] = convertAST(nonUndefinedType, context)
        }
      } else {
        if (result.properties) {
          result.properties[prop.name] = convertAST(prop.type, context)
        }
      }

      if (!prop.isOptional && result.required) {
        result.required.push(prop.name)
      }
    }
  } else if (!astObj.indexSignatures?.length) {
    // Empty objects still need properties and required arrays
    result.properties = {}
    result.required = []
  }

  return result
}

function convertTuple(ast: unknown, context: SchemaVisitContext): SchemaObject {
  const astObj = toAst(ast)

  // Handle S.Array() case: TupleType with empty elements and rest array
  if (
    astObj.elements &&
    astObj.elements.length === 0 &&
    astObj.rest &&
    astObj.rest.length === 1
  ) {
    // This is an array type (S.Array)
    const result: SchemaObject = {
      type: "array",
      items: convertAST(astObj.rest[0].type, context),
    }

    // Extract constraints from annotations
    const jsonSchemaAnnotation = extractJSONSchemaAnnotation(ast)
    if (jsonSchemaAnnotation) {
      Object.assign(result, jsonSchemaAnnotation)
    }

    return result
  }

  // Handle NonEmptyArray case: single element with rest
  if (
    astObj.elements &&
    astObj.elements.length === 1 &&
    astObj.rest &&
    astObj.rest.length === 1 &&
    toAst(astObj.elements[0]).type._tag === toAst(astObj.rest[0]).type._tag
  ) {
    // This is NonEmptyArray - treat as simple array with minItems
    const result: SchemaObject = {
      type: "array",
      items: convertAST(astObj.elements[0].type, context),
      minItems: 1,
    }

    return result
  }

  // Handle actual tuple types
  const result: SchemaObject = {
    type: "array",
  }

  if (astObj.elements && astObj.elements.length > 0) {
    // Fixed tuple with specific types at each position
    if (astObj.elements.length === 1) {
      // Single element tuple - use items directly
      result.items = convertAST(astObj.elements[0].type, context)
    } else {
      // Multiple elements - use items array for ordered types
      result.items = astObj.elements.map((elem: unknown) =>
        convertAST(toAst(elem).type, context),
      )
    }

    const requiredCount = astObj.elements.filter(
      (elem: unknown) => !toAst(elem).isOptional,
    ).length
    const totalCount = astObj.elements.length

    result.minItems = requiredCount
    if (!astObj.rest || astObj.rest.length === 0) {
      result.maxItems = totalCount
    }
  }

  if (astObj.rest && astObj.rest.length > 0) {
    // Additional items beyond the fixed tuple elements
    result.additionalItems = convertAST(astObj.rest[0].type, context)
  }

  return result
}

function convertUnion(ast: unknown, context: SchemaVisitContext): SchemaObject {
  const astObj = toAst(ast)

  if (!astObj.types || astObj.types.length === 0) {
    throw new Error("Union AST must have types property")
  }

  // Special case: if all union members are literals of the same type, convert to enum
  const allLiterals = astObj.types.every(
    (type: unknown) => toAst(type)._tag === "Literal",
  )
  if (allLiterals) {
    const values = astObj.types.map((type: unknown) => toAst(type).literal)
    const firstType = typeof values[0]
    const sameType = values.every((val: unknown) => typeof val === firstType)

    if (sameType) {
      return {
        type:
          firstType === "string"
            ? "string"
            : firstType === "number"
              ? "number"
              : "boolean",
        enum: values,
      }
    }
  }

  // Special case: single union member
  if (astObj.types.length === 1) {
    return convertAST(astObj.types[0], context)
  }

  // Special case: handle duplicate types (deduplicate them)
  const uniqueTypes = new Map<string, AST>()
  for (const type of astObj.types) {
    const converted = convertAST(type, context)
    const key = JSON.stringify(converted)
    if (!uniqueTypes.has(key)) {
      uniqueTypes.set(key, type)
    }
  }

  // If after deduplication we have only one type, return it directly
  if (uniqueTypes.size === 1) {
    const singleType = Array.from(uniqueTypes.values())[0]
    if (singleType) {
      return convertAST(singleType, context)
    }
  }

  const oneOf = Array.from(uniqueTypes.values()).map((type: AST) =>
    convertAST(type, context),
  )

  const result: SchemaObject = { oneOf }

  // Check for discriminated union
  const discriminator = detectDiscriminatorFromAST(
    Array.from(uniqueTypes.values()),
  )
  if (discriminator) {
    result.discriminator = { propertyName: discriminator }
  }

  return result
}

function convertRefinement(
  ast: unknown,
  context: SchemaVisitContext,
): SchemaObject {
  const astObj = toAst(ast)

  // Start with the base type
  const result = convertAST(astObj.from, context)

  // Extract and merge all JSONSchema annotations from the refinement chain
  const allConstraints = extractAllRefinementConstraints(ast)
  Object.assign(result, allConstraints)

  return result
}

function extractAllRefinementConstraints(
  ast: unknown,
): Record<string, unknown> {
  const astObj = toAst(ast)
  const constraints: Record<string, unknown> = {}

  // Extract constraints from current refinement
  const jsonSchemaAnnotation = extractJSONSchemaAnnotation(ast)
  if (jsonSchemaAnnotation) {
    Object.assign(constraints, jsonSchemaAnnotation)
  }

  // If the 'from' is also a refinement, recursively extract its constraints
  if (astObj.from && toAst(astObj.from)._tag === "Refinement") {
    const fromConstraints = extractAllRefinementConstraints(astObj.from)
    Object.assign(constraints, fromConstraints)
  }

  return constraints
}

function convertSuspend(
  ast: unknown,
  context: SchemaVisitContext,
): SchemaObject {
  const astObj = toAst(ast)

  // For suspended schemas (lazy/recursive), we need to evaluate the function
  // This is a simplified approach - in practice, you might need more sophisticated handling
  try {
    const resolvedAST = astObj.f().ast
    return convertAST(resolvedAST, context)
  } catch {
    // Fallback for circular references
    return { type: "object" }
  }
}

function extractJSONSchemaAnnotation(
  ast: unknown,
): Record<string, unknown> | null {
  const astObj = toAst(ast)
  if (!astObj.annotations) return null

  // Look for JSONSchema annotation symbol
  const symbols = Object.getOwnPropertySymbols(astObj.annotations)
  for (const symbol of symbols) {
    const keyStr = symbol.toString()
    if (keyStr.includes("JSONSchema")) {
      const value = astObj.annotations[symbol]
      // Convert OpenAPI 3.1 style exclusive bounds to OpenAPI 3.0 style
      const result = { ...value }

      if (typeof result.exclusiveMinimum === "number") {
        const min = result.exclusiveMinimum
        delete result.exclusiveMinimum
        result.minimum = min
        result.exclusiveMinimum = true
      }

      if (typeof result.exclusiveMaximum === "number") {
        const max = result.exclusiveMaximum
        delete result.exclusiveMaximum
        result.maximum = max
        result.exclusiveMaximum = true
      }

      return result as Record<string, unknown>
    }
  }

  return null
}

function extractAnnotations(ast: unknown): Partial<SchemaObject> | null {
  const astObj = toAst(ast)
  if (!astObj.annotations) return null

  const result: Partial<SchemaObject> = {}

  // Check both string keys and symbol keys
  const allKeys = [
    ...Object.keys(astObj.annotations),
    ...Object.getOwnPropertySymbols(astObj.annotations),
  ]

  for (const key of allKeys) {
    const keyStr = key.toString()
    const value = astObj.annotations[key]

    if (keyStr.includes("Title")) {
      if (!isAutoGeneratedTitle(value)) {
        result.title = value as string
      }
    } else if (keyStr.includes("Description")) {
      if (!isAutoGeneratedDescription(value)) {
        result.description = value as string
      }
    } else if (keyStr.includes("Examples")) {
      result.examples = value as unknown[]
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

function isAutoGeneratedTitle(value: unknown): boolean {
  if (typeof value !== "string") return false

  const autoTitles = [
    "string",
    "number",
    "boolean",
    "undefined",
    "null",
    "nonEmptyString",
    "int",
    "greaterThan",
    "lessThan",
    "greaterThanOrEqualTo",
    "lessThanOrEqualTo",
    "minLength",
    "maxLength",
    "pattern",
    "multipleOf",
    "between",
    "nonNegative",
    "positive",
    "minItems",
    "maxItems",
    "itemsCount",
  ]

  return autoTitles.some(
    (auto) =>
      value === auto ||
      value.includes("(") || // function call syntax like "greaterThan(0)" or "minItems(1)"
      value.includes("minLength") ||
      value.includes("maxLength") ||
      value.includes("minItems") ||
      value.includes("maxItems") ||
      value.includes("itemsCount") ||
      value.includes("pattern") ||
      value.includes("multipleOf") ||
      value.includes("between") ||
      value.includes("nonNegative") ||
      value.includes("positive"),
  )
}

function isAutoGeneratedDescription(value: unknown): boolean {
  if (typeof value !== "string") return false

  const autoDescriptionPatterns = [
    "a string",
    "a number",
    "a boolean",
    "an integer",
    "character(s)",
    "divisible by",
    "less than",
    "greater than",
    "between",
    "non-negative",
    "positive",
    "non empty",
    "matching the pattern",
    "a positive number",
    "a number less than",
    "a number greater than",
    "an array of at least",
    "an array of at most",
    "an array of exactly",
  ]

  return autoDescriptionPatterns.some((pattern) => value.includes(pattern))
}

function detectDiscriminatorFromAST(types: unknown[]): string | null {
  if (types.length < 2) return null

  // Check if all types are TypeLiterals with a common literal property
  const objectTypes = types.filter(
    (t) => toAst(t)._tag === "TypeLiteral" && toAst(t).propertySignatures,
  )
  if (objectTypes.length !== types.length) return null

  // Find common properties that are literals
  const firstProps =
    toAst(objectTypes[0]).propertySignatures?.map(
      (p: unknown) => toAst(p).name,
    ) || []

  for (const propName of firstProps) {
    const allHaveProp = objectTypes.every((type) =>
      toAst(type).propertySignatures.some(
        (p: unknown) =>
          toAst(p).name === propName && toAst(toAst(p).type)._tag === "Literal",
      ),
    )

    if (allHaveProp) {
      const values = objectTypes.map((type) => {
        const prop = toAst(type).propertySignatures.find(
          (p: unknown) => toAst(p).name === propName,
        )
        return toAst(toAst(prop).type).literal
      })
      const uniqueValues = new Set(values)

      if (uniqueValues.size === values.length) {
        return propName
      }
    }
  }

  return null
}

export class EffectSchemaConverter implements ConditionalSchemaConverter {
  condition(schema: AnySchema): boolean {
    return schema !== undefined && schema["~standard"].vendor === "effect"
  }

  convert(
    schema: AnySchema | undefined,
    _options: SchemaConvertOptions,
  ): [required: boolean, jsonSchema: OrpcOpenAPIJSONSchema] {
    const simplifiedSchema = schema as StandardSchemaV1 &
      S.Schema<unknown, unknown, never>

    const result = convertEffectSchemaToOpenAPI(simplifiedSchema)

    return [true, result as OrpcOpenAPIJSONSchema]
  }
}
