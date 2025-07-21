import type { ParseError, ParseIssue } from "effect/ParseResult"
import { getDescriptionAnnotation } from "effect/SchemaAST"
import { ValidationError, type ValidationIssue } from "./base.errors"

export const mergeValidationErrors = (
  errors: ValidationError[],
): ValidationError => {
  const issues: ValidationIssue[] = errors.flatMap((err) => err.issues)

  return ValidationError.multiple(issues)
}

export const parseErrorsToValidationError = (
  parseErrors: ParseError[],
): ValidationError => {
  if (parseErrors.length === 0) {
    return ValidationError.single("Unknown validation error")
  }

  const issues: ValidationIssue[] = parseErrors.flatMap((err) =>
    getIssuesFromParseErrorIssue(err.issue),
  )
  return ValidationError.multiple(issues)
}

export const parseErrorToValidationError = (
  error: ParseError,
): ValidationError => {
  const issues = getIssuesFromParseErrorIssue(error.issue)
  return ValidationError.multiple(issues)
}

export const getIssuesFromParseErrorIssue = (
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
          cause: issue,
          value: issue.actual,
        },
      ]
    }
    case "Missing": {
      return [
        {
          message: issue.message || "Missing field",
          cause: issue,
          value: issue.actual,
        },
      ]
    }
    case "Pointer": {
      const innerIssues = getIssuesFromParseErrorIssue(issue.issue)
      const path = issue.path as string
      for (const innerIssue of innerIssues) {
        innerIssue.path = [path, ...(innerIssue.path || [])]
        innerIssue.field = pathToFieldName(innerIssue.path)
      }

      return innerIssues
    }
    case "Composite": {
      if (Array.isArray(issue.issues)) {
        const innerIssues = issue.issues.flatMap(getIssuesFromParseErrorIssue)

        return innerIssues
      } else {
        return getIssuesFromParseErrorIssue(issue.issues as ParseIssue)
      }
    }
    case "Refinement": {
      const descAnnot = getDescriptionAnnotation(issue.ast)
      if (descAnnot._tag === "None") {
        throw new Error(
          `Refinement transformation failed: Missing description annotation for AST node '${JSON.stringify(issue.ast)}'. A description annotation is required to provide context for the expected type.`,
        )
      }
      const expectedType = descAnnot.value

      return [
        {
          message: `Expected ${expectedType}, got '${issue.actual}'`,
          cause: issue,
          value: issue.actual,
        },
      ]
    }
    case "Transformation": {
      const descAnnot = getDescriptionAnnotation(issue.ast.from)
      if (descAnnot._tag === "None") {
        throw new Error("Transformation case without description annotation")
      }
      const expectedType = descAnnot.value

      return [
        {
          message: `Expected ${expectedType}, got ${typeof issue.actual}`,
          cause: issue,
        },
      ]
    }

    default: {
      throw new Error(
        `Unsupported issue type '${issue._tag}' encountered in 'getIssuesFromParseErrorIssue'. Please ensure all issue types are implemented or report this issue to the development team.`,
      )
    }
  }
}

function pathToFieldName(path: string[]): string | undefined {
  return path.length > 0 ? path.join(".") : undefined
}

export const validationErrorsToSingle = (
  errors: ValidationError[],
): ValidationError => {
  if (errors.length === 0) {
    return ValidationError.single("Unknown validation error")
  }

  if (errors.length === 1) {
    return errors[0] as ValidationError
  }

  const allIssues = errors.flatMap((error) => error.issues)
  return ValidationError.multiple(allIssues)
}
