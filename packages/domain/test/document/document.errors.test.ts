import { describe, expect, it } from "bun:test"
import { 
  DocumentNotFoundError, 
  DocumentValidationError, 
  DocumentAlreadyExistsError,
  DocumentFileError, 
  DocumentPermissionError, 
  DocumentUploadError 
} from "@domain/document/document.errors"

describe("Document Errors", () => {
  describe("DocumentNotFoundError", () => {
    it("should create error with message", () => {
      const error = new DocumentNotFoundError("doc-123" as any) // Type assertion for UUID
      expect(error.message).toBe("Document with id 'doc-123' not found")
      expect(error.code).toBe("DOCUMENT_NOT_FOUND")
    })

    it("should accept context", () => {
      const context = { documentId: "doc-123", operation: "read" }
      const error = new DocumentNotFoundError("doc-123" as any, context) // Type assertion for UUID
      expect(error.context).toEqual(context)
    })
  })

  describe("DocumentValidationError", () => {
    it("should create error with message", () => {
      const error = new DocumentValidationError("Validation failed")
      expect(error.message).toBe("Validation failed")
      expect(error.code).toBe("DOCUMENT_VALIDATION_ERROR")
    })

    it("should accept issues and context", () => {
      const issues = [{ message: "Invalid name", path: ["name"] }] as any // Type assertion for ValidationIssue[]
      const context = { field: "name", value: "invalid" }
      const error = new DocumentValidationError("Validation failed", issues, context)
      expect(error.issues).toEqual(issues)
      expect(error.context).toEqual(context)
    })
  })

  describe("DocumentAlreadyExistsError", () => {
    it("should create error with message", () => {
      const error = new DocumentAlreadyExistsError("test.pdf")
      expect(error.message).toBe("Conflict: Document with name 'test.pdf' already exists")
      expect(error.code).toBe("DOCUMENT_ALREADY_EXISTS")
    })

    it("should accept context", () => {
      const context = { operation: "create", timestamp: new Date().toISOString() }
      const error = new DocumentAlreadyExistsError("test.pdf", context)
      expect(error.context).toEqual(context)
    })
  })

  describe("DocumentFileError", () => {
    it("should create error with message", () => {
      const error = new DocumentFileError("File read failed")
      expect(error.message).toBe("File read failed")
      expect(error.code).toBe("DOCUMENT_FILE_ERROR")
    })

    it("should accept context", () => {
      const context = { filePath: "/uploads/test.pdf", operation: "read", error: "Permission denied" }
      const error = new DocumentFileError("File read failed", context)
      expect(error.context).toEqual(context)
    })
  })

  describe("DocumentPermissionError", () => {
    it("should create error with message", () => {
      const error = new DocumentPermissionError("Access denied")
      expect(error.message).toBe("Access denied")
      expect(error.code).toBe("DOCUMENT_PERMISSION_ERROR")
    })

    it("should accept context", () => {
      const context = { userId: "user-123", documentId: "doc-123", requiredPermission: "write" }
      const error = new DocumentPermissionError("Access denied", context)
      expect(error.context).toEqual(context)
    })
  })

  describe("DocumentUploadError", () => {
    it("should create error with message", () => {
      const error = new DocumentUploadError("Upload failed")
      expect(error.message).toBe("Upload failed")
      expect(error.code).toBe("DOCUMENT_UPLOAD_ERROR")
    })

    it("should accept context", () => {
      const context = { fileName: "large.pdf", fileSize: 10485760, maxSize: 5242880 }
      const error = new DocumentUploadError("Upload failed", context)
      expect(error.context).toEqual(context)
    })
  })

  describe("Error Inheritance", () => {
    it("should extend base error types", () => {
      const notFoundError = new DocumentNotFoundError("doc-123" as any) // Type assertion for UUID
      const validationError = new DocumentValidationError("Validation failed")
      const conflictError = new DocumentAlreadyExistsError("test.pdf")
      const fileError = new DocumentFileError("File error")
      const permissionError = new DocumentPermissionError("Permission denied")
      const uploadError = new DocumentUploadError("Upload failed")

      expect(notFoundError).toBeInstanceOf(Error)
      expect(validationError).toBeInstanceOf(Error)
      expect(conflictError).toBeInstanceOf(Error)
      expect(fileError).toBeInstanceOf(Error)
      expect(permissionError).toBeInstanceOf(Error)
      expect(uploadError).toBeInstanceOf(Error)
    })

    it("should have proper error codes", () => {
      const notFoundError = new DocumentNotFoundError("doc-123" as any) // Type assertion for UUID
      const validationError = new DocumentValidationError("Validation failed")
      const conflictError = new DocumentAlreadyExistsError("test.pdf")
      const fileError = new DocumentFileError("File error")
      const permissionError = new DocumentPermissionError("Permission denied")
      const uploadError = new DocumentUploadError("Upload failed")

      expect(notFoundError.code).toBe("DOCUMENT_NOT_FOUND")
      expect(validationError.code).toBe("DOCUMENT_VALIDATION_ERROR")
      expect(conflictError.code).toBe("DOCUMENT_ALREADY_EXISTS")
      expect(fileError.code).toBe("DOCUMENT_FILE_ERROR")
      expect(permissionError.code).toBe("DOCUMENT_PERMISSION_ERROR")
      expect(uploadError.code).toBe("DOCUMENT_UPLOAD_ERROR")
    })
  })

  describe("Error Context", () => {
    it("should preserve context information", () => {
      const context = { 
        documentId: "doc-123", 
        operation: "update", 
        timestamp: new Date().toISOString() 
      }
      
      const notFoundError = new DocumentNotFoundError("doc-123" as any, context) // Type assertion for UUID
      const validationError = new DocumentValidationError("Validation failed", [], context)
      
      expect(notFoundError.context).toEqual(context)
      expect(validationError.context).toEqual(context)
    })

    it("should handle empty context", () => {
      const notFoundError = new DocumentNotFoundError("doc-123" as any) // Type assertion for UUID
      const validationError = new DocumentValidationError("Validation failed")
      
      expect(notFoundError.context).toBeUndefined()
      expect(validationError.context).toBeUndefined()
    })
  })
})
