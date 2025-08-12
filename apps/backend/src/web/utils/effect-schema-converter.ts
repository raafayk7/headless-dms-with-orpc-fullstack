import type { AnySchema } from "@orpc/contract"
import type {
  ConditionalSchemaConverter,
  JSONSchema as OrpcOpenAPIJSONSchema,
  SchemaConvertOptions,
} from "@orpc/openapi"
import type { OpenAPIV3_1 } from "@scalar/openapi-types"
import type { StandardSchemaV1 } from "@standard-schema/spec"
import type { Schema as S } from "effect"
import type { AST } from "effect/SchemaAST"

type SchemaObject = OpenAPIV3_1.SchemaObject

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

  return convertAST(schema.ast, context)
}

function convertAST(ast: AST, context: SchemaVisitContext): SchemaObject {
  if (context.visited.has(ast)) {
    return { type: "object" }
  }

  if (context.depth > 10) {
    throw new Error("Maximum schema depth exceeded")
  }

  context.visited.add(ast)
  context.depth++

  try {
    const result = convertASTNode(ast, context)

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
    case "Transformation":
      return convertTransformation(ast, context)
    case "Declaration":
      return convertDeclaration(ast, context)
    default:
      throw new Error(`Unsupported AST node type: ${ast._tag}`)
  }
}

function convertLiteral(ast: AST): SchemaObject {
  if (ast._tag !== "Literal") throw new Error("Expected Literal AST")

  const value = ast.literal

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
  ast: AST,
  context: SchemaVisitContext,
): SchemaObject {
  if (ast._tag !== "TypeLiteral") throw new Error("Expected TypeLiteral AST")

  const result: SchemaObject = {
    type: "object",
  }

  if (ast.indexSignatures && ast.indexSignatures.length > 0) {
    const indexSig = ast.indexSignatures[0]
    if (indexSig) {
      result.additionalProperties = convertAST(indexSig.type, context)
    }
  }

  // Handle object types with properties
  if (ast.propertySignatures && ast.propertySignatures.length > 0) {
    result.properties = {}
    result.required = []

    for (const prop of ast.propertySignatures) {
      const propName = String(prop.name)

      if (
        prop.isOptional &&
        prop.type._tag === "Union" &&
        prop.type.types.length === 2 &&
        prop.type.types.some((t: AST) => t._tag === "UndefinedKeyword")
      ) {
        const nonUndefinedType = prop.type.types.find(
          (t: AST) => t._tag !== "UndefinedKeyword",
        )
        if (result.properties && nonUndefinedType) {
          result.properties[propName] = convertAST(nonUndefinedType, context)
        }
      } else {
        if (result.properties) {
          result.properties[propName] = convertAST(prop.type, context)
        }
      }

      if (!prop.isOptional && result.required) {
        result.required.push(propName)
      }
    }
  } else if (!ast.indexSignatures?.length) {
    result.properties = {}
    result.required = []
  }

  return result
}

function convertTuple(ast: AST, context: SchemaVisitContext): SchemaObject {
  if (ast._tag !== "TupleType") throw new Error("Expected TupleType AST")

  if (
    ast.elements &&
    ast.elements.length === 0 &&
    ast.rest &&
    ast.rest.length === 1
  ) {
    // This is an array type (S.Array)
    const restItem = ast.rest[0]
    if (restItem) {
      const result: SchemaObject = {
        type: "array",
        items: convertAST(restItem.type, context),
      }

      const jsonSchemaAnnotation = extractJSONSchemaAnnotation(ast)
      if (jsonSchemaAnnotation) {
        Object.assign(result, jsonSchemaAnnotation)
      }

      return result
    }
  }

  if (
    ast.elements &&
    ast.elements.length === 1 &&
    ast.rest &&
    ast.rest.length === 1
  ) {
    const firstElement = ast.elements[0]
    const restElement = ast.rest[0]

    if (
      firstElement &&
      restElement &&
      firstElement.type._tag === restElement.type._tag
    ) {
      // This is NonEmptyArray - treat as simple array with minItems
      const result: SchemaObject = {
        type: "array",
        items: convertAST(firstElement.type, context),
        minItems: 1,
      }

      return result
    }
  }

  const result: SchemaObject = {
    type: "array",
  }

  if (ast.elements && ast.elements.length > 0) {
    if (ast.elements.length === 1) {
      const firstElement = ast.elements[0]
      if (firstElement) {
        result.items = convertAST(firstElement.type, context)
      }
    } else {
      result.items = ast.elements.map((elem) => convertAST(elem.type, context))
    }

    const requiredCount = ast.elements.filter((elem) => !elem.isOptional).length
    const totalCount = ast.elements.length

    result.minItems = requiredCount
    if (!ast.rest || ast.rest.length === 0) {
      result.maxItems = totalCount
    }
  }

  if (ast.rest && ast.rest.length > 0) {
    const firstRestElement = ast.rest[0]
    if (firstRestElement) {
      result.additionalItems = convertAST(firstRestElement.type, context)
    }
  }

  return result
}

function convertUnion(ast: AST, context: SchemaVisitContext): SchemaObject {
  if (ast._tag !== "Union") {
    throw new Error("Expected Union AST")
  }

  if (!ast.types || ast.types.length === 0) {
    throw new Error("Union AST must have types property")
  }

  const allLiterals = ast.types.every((type: AST) => type._tag === "Literal")
  if (allLiterals) {
    const values = ast.types.map((type: AST) => {
      if (type._tag !== "Literal") {
        throw new Error("Expected Literal AST")
      }
      return type.literal
    })
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

  if (ast.types.length === 1) {
    return convertAST(ast.types[0], context)
  }

  const seenTypes = new Map<string, { ast: AST; converted: SchemaObject }>()
  for (const type of ast.types) {
    const converted = convertAST(type, context)
    const coreTypeKey = getCoreTypeKey(converted)

    if (!seenTypes.has(coreTypeKey)) {
      seenTypes.set(coreTypeKey, { ast: type, converted })
    }
  }

  if (seenTypes.size === 1) {
    const singleEntry = Array.from(seenTypes.values())[0]
    if (singleEntry) {
      return singleEntry.converted
    }
  }

  const oneOf = Array.from(seenTypes.values()).map((entry) => entry.converted)

  const result: SchemaObject = { oneOf }

  const discriminator = detectDiscriminatorFromAST(
    Array.from(seenTypes.values()).map((entry) => entry.ast),
  )
  if (discriminator) {
    result.discriminator = { propertyName: discriminator }
  }

  return result
}

function convertRefinement(
  ast: AST,
  context: SchemaVisitContext,
): SchemaObject {
  if (ast._tag !== "Refinement") {
    throw new Error("Expected Refinement AST")
  }

  const result = convertAST(ast.from, context)

  const allConstraints = extractAllRefinementConstraints(ast)
  Object.assign(result, allConstraints)

  return result
}

function extractAllRefinementConstraints(ast: AST): Record<string, unknown> {
  if (ast._tag !== "Refinement") {
    return {}
  }

  const constraints: Record<string, unknown> = {}

  const jsonSchemaAnnotation = extractJSONSchemaAnnotation(ast)
  if (jsonSchemaAnnotation) {
    Object.assign(constraints, jsonSchemaAnnotation)
  }

  if (ast.from && ast.from._tag === "Refinement") {
    const fromConstraints = extractAllRefinementConstraints(ast.from)
    Object.assign(constraints, fromConstraints)
  }

  return constraints
}

function convertSuspend(ast: AST, context: SchemaVisitContext): SchemaObject {
  if (ast._tag !== "Suspend") {
    throw new Error("Expected Suspend AST")
  }

  try {
    const resolvedAST = ast.f()
    return convertAST(resolvedAST, context)
  } catch {
    return { type: "object" }
  }
}

function convertTransformation(
  ast: AST,
  context: SchemaVisitContext,
): SchemaObject {
  if (ast._tag !== "Transformation") {
    throw new Error("Expected Transformation AST")
  }

  const baseResult = ast.from
    ? convertAST(ast.from, context)
    : { type: "string" }

  const transformationAnnotations = extractAnnotations(ast)

  const isDateTime =
    ast.annotations &&
    (Object.getOwnPropertySymbols(ast.annotations).some(
      (sym) =>
        sym.toString().includes("DateTimeUtc") ||
        sym.toString().includes("DateTime"),
    ) ||
      transformationAnnotations?.title
        ?.toString()
        .toLowerCase()
        .includes("time") ||
      transformationAnnotations?.description
        ?.toString()
        .toLowerCase()
        .includes("time"))

  if (isDateTime && baseResult.type === "number") {
    const result = baseResult as SchemaObject & {
      format?: string
      description?: string
    }
    result.format = "timestamp"
    if (
      !transformationAnnotations?.description ||
      isAutoGeneratedDescription(transformationAnnotations.description)
    ) {
      result.description = "Unix timestamp in milliseconds"
    }
  }

  if (transformationAnnotations) {
    Object.assign(baseResult, transformationAnnotations)
  }

  return baseResult as SchemaObject
}

function convertDeclaration(
  ast: AST,
  context: SchemaVisitContext,
): SchemaObject {
  if (ast._tag !== "Declaration") {
    throw new Error("Expected Declaration AST")
  }

  const annotations = extractAnnotations(ast)
  const isDateTime =
    annotations?.title?.toString().toLowerCase().includes("time") ||
    annotations?.description?.toString().toLowerCase().includes("time") ||
    (ast.annotations &&
      Object.getOwnPropertySymbols(ast.annotations).some(
        (sym) =>
          sym.toString().includes("DateTimeUtc") ||
          sym.toString().includes("DateTime"),
      ))

  if (isDateTime) {
    const result: SchemaObject = {
      type: "number",
      format: "timestamp",
      description: "Unix timestamp in milliseconds",
    }

    const jsonSchemaAnnotation = extractJSONSchemaAnnotation(ast)
    if (jsonSchemaAnnotation) {
      Object.assign(result, jsonSchemaAnnotation)
    }

    if (annotations) {
      const { title, description, examples, ...rest } = annotations
      Object.assign(result, rest)

      if (title && !isAutoGeneratedTitle(title)) {
        result.title = title as string
      }
      if (description && !isAutoGeneratedDescription(description)) {
        result.description = description as string
      }
      if (examples) {
        result.examples = examples
      }
    }

    return result
  }

  if (
    ast.typeParameters &&
    ast.typeParameters.length > 0 &&
    ast.typeParameters[0]
  ) {
    return convertAST(ast.typeParameters[0], context)
  }

  // Default fallback
  return { type: "string" }
}

function extractJSONSchemaAnnotation(ast: AST): Record<string, unknown> | null {
  if (!ast.annotations) return null

  // Look for JSONSchema annotation symbol
  const symbols = Object.getOwnPropertySymbols(ast.annotations)
  for (const symbol of symbols) {
    const keyStr = symbol.toString()
    if (keyStr.includes("JSONSchema")) {
      const value = ast.annotations[symbol]
      if (typeof value === "object" && value !== null) {
        // Convert OpenAPI 3.1 style exclusive bounds to OpenAPI 3.0 style
        const result = { ...value } as Record<string, unknown>

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
  }

  return null
}

function extractAnnotations(ast: AST): Partial<SchemaObject> | null {
  if (!ast.annotations) return null

  const result: Partial<SchemaObject> = {}

  // Check both string keys and symbol keys
  const allKeys = [
    ...Object.keys(ast.annotations),
    ...Object.getOwnPropertySymbols(ast.annotations),
  ]

  for (const key of allKeys) {
    const keyStr = key.toString()
    const value = ast.annotations[key]

    if (keyStr.includes("Title")) {
      if (value != null && !isAutoGeneratedTitle(value)) {
        result.title = value as string
      }
    } else if (keyStr.includes("Description")) {
      if (value != null && !isAutoGeneratedDescription(value)) {
        result.description = value as string
      }
    } else if (keyStr.includes("Examples")) {
      if (value != null) {
        result.examples = value as unknown[]
      }
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

  if (autoTitles.includes(value)) {
    return true
  }

  const functionCallPatterns = [
    /^(greaterThan|lessThan|greaterThanOrEqualTo|lessThanOrEqualTo|minLength|maxLength|minItems|maxItems|itemsCount|pattern|multipleOf|between)\(.+\)$/,
    /^(nonNegative|positive)\(\)$/,
    /^length\(\d+\)$/,
  ]

  return functionCallPatterns.some((pattern) => pattern.test(value))
}

function isAutoGeneratedDescription(value: unknown): boolean {
  if (typeof value !== "string") return false

  const autoDescriptionPatterns = [
    /^a string$/,
    /^a number$/,
    /^a boolean$/,
    /^an integer$/,
    /^a string at least \d+ character\(s\) long$/,
    /^a string at most \d+ character\(s\) long$/,
    /^a string \d+ character\(s\) long$/,
    /^a string matching the pattern .+$/,
    /^a non empty string$/,
    /^a non-negative number$/,
    /^a number between .+ and .+$/,
    /^a number divisible by \d+$/,
    /^divisible by/,
    /^less than/,
    /^greater than/,
    /^between/,
    /^positive/,
    /^a positive number$/,
    /^a number less than/,
    /^a number greater than/,
    /^an array of at least/,
    /^an array of at most/,
    /^an array of exactly/,
  ]

  return autoDescriptionPatterns.some((pattern) => pattern.test(value))
}

function detectDiscriminatorFromAST(types: AST[]): string | null {
  if (types.length < 2) return null

  const objectTypes = types.filter(
    (t) => t._tag === "TypeLiteral" && t.propertySignatures,
  )
  if (objectTypes.length !== types.length) return null

  const firstType = objectTypes[0]
  if (firstType?._tag !== "TypeLiteral" || !firstType.propertySignatures) {
    return null
  }

  const firstProps = firstType.propertySignatures.map((p) => String(p.name))

  for (const propName of firstProps) {
    const allHaveProp = objectTypes.every((type) => {
      if (type._tag !== "TypeLiteral" || !type.propertySignatures) {
        return false
      }
      return type.propertySignatures.some(
        (p) => String(p.name) === propName && p.type._tag === "Literal",
      )
    })

    if (allHaveProp) {
      const values = objectTypes
        .map((type) => {
          if (type._tag !== "TypeLiteral" || !type.propertySignatures) {
            return null
          }
          const prop = type.propertySignatures.find(
            (p) => String(p.name) === propName,
          )
          if (prop?.type._tag === "Literal") {
            return prop.type.literal
          }
          return null
        })
        .filter((v) => v !== null)

      const uniqueValues = new Set(values)

      if (
        uniqueValues.size === values.length &&
        values.length === objectTypes.length
      ) {
        return propName
      }
    }
  }

  return null
}

function getCoreTypeKey(schema: SchemaObject): string {
  const normalizedType = schema.type === "integer" ? "number" : schema.type

  const core = {
    type: normalizedType,
    ...(schema.enum && { enum: schema.enum }),
    ...(schema.properties && {
      properties: Object.keys(schema.properties).sort(),
    }),
    ...(schema.items && {
      items: getCoreTypeKey(schema.items as SchemaObject),
    }),
    ...(schema.oneOf && { oneOf: true }),
  }

  return JSON.stringify(core)
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
