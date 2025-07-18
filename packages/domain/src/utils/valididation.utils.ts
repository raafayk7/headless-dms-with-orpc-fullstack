import type { ParseError, ParseIssue } from "effect/ParseResult"
import { ValidationError, type ValidationIssue } from "./base.errors"
import { getTitleAnnotation, getDescriptionAnnotation } from "effect/SchemaAST"

export const mergeValidationErrors = (
  errors: ValidationError[],
): ValidationError => {
  const issues: ValidationIssue[] = errors.flatMap((err) => err.issues)

  return ValidationError.multiple(issues)
}

export function parseErrorsToValidationError(
  parseErrors: ParseError[],
): ValidationError {
  if (parseErrors.length === 0) {
    return ValidationError.single("Unknown validation error")
  }

  const issues: ValidationIssue[] = parseErrors.flatMap(parseErrorToIssues)
  return ValidationError.multiple(issues)
}

export const parseErrorToValidationError = (
  error: ParseError,
): ValidationError => {
  const issues = getIssuesFromParseErrorIssues(error.issue)
  return ValidationError.multiple(issues)
}

function parseErrorToIssues(parseError: ParseError): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  collectIssuesFromParseError(parseError, [], issues)

  return issues
}

export const getIssuesFromParseErrorIssues = (
  issue: ParseIssue,
): ValidationIssue[] => {
  switch (issue._tag) {
    case "Type": {
      let expectedType = "nothing"
      const descAnnot = getDescriptionAnnotation(issue.ast)
      if (descAnnot._tag === "Some") {
        expectedType = descAnnot.value
      }
      return [
        {
          message:
            issue.message ||
            `TypeError: Expected ${expectedType}, got ${typeof issue.actual}`,
          // cause: issue,
          value: issue.actual,
        },
      ]
    }
    case "Missing": {
      return [
        {
          message: issue.message || "Missing field",
          // cause: issue,
          value: issue.actual,
        },
      ]
    }
    case "Pointer": {
      const innerIssues = getIssuesFromParseErrorIssues(issue.issue)
      const path = issue.path as string
      for (const innerIssue of innerIssues) {
        innerIssue.path = [path, ...(innerIssue.path || [])]
      }

      return innerIssues
    }
    case "Composite": {
      // @ts-expect-error not an iterator
      const issueArr = Array.from(issue.issues)
      const innerIssues = issueArr.flatMap(getIssuesFromParseErrorIssues)

      return innerIssues
    }

    default: {
      throw new Error(`Not implemented issue type: ${issue._tag}`)
    }
  }
}

function collectIssuesFromParseError(
  error: ParseError,
  currentPath: string[],
  issues: ValidationIssue[],
): void {
  // ParseError has a _tag field that indicates the type of error
  // We need to use unknown type to access the internal structure
  const issue = error.issue
  const errorRecord = error as unknown as Record<string, unknown>

  switch (issue._tag) {
    case "Type": {
      issues.push({
        message: error.message,
        field: pathToFieldName(currentPath),
        path: [...currentPath],
        value: extractActualValue(error),
      })
      break
    }

    case "Missing": {
      issues.push({
        message: error.message || "is missing",
        field: pathToFieldName(currentPath),
        path: [...currentPath],
      })
      break
    }

    default: {
      issues.push({
        message: extractErrorMessage(error) || "Validation failed",
        field: pathToFieldName(currentPath),
        path: [...currentPath],
        value: extractActualValue(error),
      })
    }
  }
}

function extractErrorMessage(error: ParseError): string {
  // Try to get the message from various possible locations
  const errorRecord = error as unknown as Record<string, unknown>

  if (typeof errorRecord.message === "string") {
    return errorRecord.message
  }

  if (errorRecord.expected && errorRecord.actual !== undefined) {
    return `Expected ${errorRecord.expected}, actual ${JSON.stringify(
      errorRecord.actual,
    )}`
  }

  if (errorRecord.expected) {
    return `Expected ${errorRecord.expected}`
  }

  // Fallback to a generic message
  return "Validation failed"
}

function extractActualValue(error: ParseError): unknown {
  const errorRecord = error as unknown as Record<string, unknown>
  return errorRecord.actual
}

function extractPathFromError(error: ParseError): string[] | undefined {
  const errorRecord = error as unknown as Record<string, unknown>
  const path = errorRecord.path
  return Array.isArray(path) ? path : undefined
}

function pathToFieldName(path: string[]): string | undefined {
  return path.length > 0 ? path.join(".") : undefined
}

export function validationErrorsToSingle(
  errors: ValidationError[],
): ValidationError {
  if (errors.length === 0) {
    return ValidationError.single("Unknown validation error")
  }

  if (errors.length === 1) {
    return errors[0] as ValidationError
  }

  const allIssues = errors.flatMap((error) => error.issues)
  return ValidationError.multiple(allIssues)
}
