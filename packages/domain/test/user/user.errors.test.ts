import { describe, expect, it } from "bun:test"
import { 
  UserNotFoundError, 
  UserValidationError, 
  UserAlreadyExistsError,
  UserRoleChangeError, 
  UserAuthenticationError 
} from "@domain/user/user.errors"

describe("User Errors", () => {
  describe("UserNotFoundError", () => {
    it("should create error with message", () => {
      const error = new UserNotFoundError("user-123" as any) // Type assertion for UUID
      expect(error.message).toBe("User with id 'user-123' not found")
      expect(error.code).toBe("USER_NOT_FOUND")
    })

    it("should accept context", () => {
      const context = { userId: "user-123", operation: "read" }
      const error = new UserNotFoundError("user-123" as any, context) // Type assertion for UUID
      expect(error.context).toEqual(context)
    })
  })

  describe("UserValidationError", () => {
    it("should create error with message", () => {
      const error = new UserValidationError("Validation failed")
      expect(error.message).toBe("Validation failed")
      expect(error.code).toBe("USER_VALIDATION_ERROR")
    })

    it("should accept issues and context", () => {
      const issues = [{ message: "Invalid email", path: ["email"] }] as any // Type assertion for ValidationIssue[]
      const context = { field: "email", value: "invalid" }
      const error = new UserValidationError("Validation failed", issues, context)
      expect(error.issues).toEqual(issues)
      expect(error.context).toEqual(context)
    })
  })

  describe("UserAlreadyExistsError", () => {
    it("should create error with message", () => {
      const error = new UserAlreadyExistsError("test@example.com")
      expect(error.message).toBe("Conflict: User with email 'test@example.com' already exists")
      expect(error.code).toBe("USER_ALREADY_EXISTS")
    })

    it("should accept context", () => {
      const context = { operation: "create", timestamp: new Date().toISOString() }
      const error = new UserAlreadyExistsError("test@example.com", context)
      expect(error.context).toEqual(context)
    })
  })

  describe("UserRoleChangeError", () => {
    it("should create error with message", () => {
      const error = new UserRoleChangeError("Role change denied")
      expect(error.message).toBe("Role change denied")
      expect(error.code).toBe("USER_ROLE_CHANGE_ERROR")
    })

    it("should accept context", () => {
      const context = { oldRole: "admin", newRole: "user", reason: "permission denied" }
      const error = new UserRoleChangeError("Role change denied", context)
      expect(error.context).toEqual(context)
    })
  })

  describe("UserAuthenticationError", () => {
    it("should create error with message", () => {
      const error = new UserAuthenticationError("Authentication failed")
      expect(error.message).toBe("Authentication failed")
      expect(error.code).toBe("USER_AUTHENTICATION_ERROR")
    })

    it("should accept context", () => {
      const context = { method: "password", reason: "invalid credentials" }
      const error = new UserAuthenticationError("Authentication failed", context)
      expect(error.context).toEqual(context)
    })
  })

  describe("Error Inheritance", () => {
    it("should extend base error types", () => {
      const notFoundError = new UserNotFoundError("user-123" as any) // Type assertion for UUID
      const validationError = new UserValidationError("Validation failed")
      const conflictError = new UserAlreadyExistsError("test@example.com")
      const roleChangeError = new UserRoleChangeError("Role change denied")
      const authError = new UserAuthenticationError("Authentication failed")

      expect(notFoundError).toBeInstanceOf(Error)
      expect(validationError).toBeInstanceOf(Error)
      expect(conflictError).toBeInstanceOf(Error)
      expect(roleChangeError).toBeInstanceOf(Error)
      expect(authError).toBeInstanceOf(Error)
    })

    it("should have proper error codes", () => {
      const notFoundError = new UserNotFoundError("user-123" as any) // Type assertion for UUID
      const validationError = new UserValidationError("Validation failed")
      const conflictError = new UserAlreadyExistsError("test@example.com")
      const roleChangeError = new UserRoleChangeError("Role change denied")
      const authError = new UserAuthenticationError("Authentication failed")

      expect(notFoundError.code).toBe("USER_NOT_FOUND")
      expect(validationError.code).toBe("USER_VALIDATION_ERROR")
      expect(conflictError.code).toBe("USER_ALREADY_EXISTS")
      expect(roleChangeError.code).toBe("USER_ROLE_CHANGE_ERROR")
      expect(authError.code).toBe("USER_AUTHENTICATION_ERROR")
    })
  })

  describe("Error Context", () => {
    it("should preserve context information", () => {
      const context = { 
        userId: "user-123", 
        operation: "update", 
        timestamp: new Date().toISOString() 
      }
      
      const notFoundError = new UserNotFoundError("user-123" as any, context) // Type assertion for UUID
      const validationError = new UserValidationError("Validation failed", [], context)
      
      expect(notFoundError.context).toEqual(context)
      expect(validationError.context).toEqual(context)
    })

    it("should handle empty context", () => {
      const notFoundError = new UserNotFoundError("user-123" as any) // Type assertion for UUID
      const validationError = new UserValidationError("Validation failed")
      
      expect(notFoundError.context).toBeUndefined()
      expect(validationError.context).toBeUndefined()
    })
  })
})
