import { NotFoundError, ValidationError, ConflictError } from "@domain/utils/base.errors"
import type { UserType } from "./user.entity"

// User not found error
export class UserNotFoundError extends NotFoundError {
  override readonly code = "USER_NOT_FOUND" as const

  constructor(userId: UserType["id"], context?: Record<string, unknown>) {
    super("User", userId, context)
  }
}

// User validation error
export class UserValidationError extends ValidationError {
  override readonly code = "USER_VALIDATION_ERROR" as const
}

// User already exists error (for duplicate emails)
export class UserAlreadyExistsError extends ConflictError {
  override readonly code = "USER_ALREADY_EXISTS" as const

  constructor(email: string, context?: Record<string, unknown>) {
    super(`User with email '${email}' already exists`, context)
  }
}

// User role change error
export class UserRoleChangeError extends ValidationError {
  override readonly code = "USER_ROLE_CHANGE_ERROR" as const

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, [], context)
  }
}

// User authentication error
export class UserAuthenticationError extends ValidationError {
  override readonly code = "USER_AUTHENTICATION_ERROR" as const

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, [], context)
  }
}
