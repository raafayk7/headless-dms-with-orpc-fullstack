import { NotFoundError, ValidationError, ConflictError } from "@domain/utils/base.errors"
import type { DocumentType } from "./document.entity"

// Document not found error
export class DocumentNotFoundError extends NotFoundError {
  override readonly code = "DOCUMENT_NOT_FOUND" as const

  constructor(documentId: DocumentType["id"], context?: Record<string, unknown>) {
    super("Document", documentId, context)
  }
}

// Document validation error
export class DocumentValidationError extends ValidationError {
  override readonly code = "DOCUMENT_VALIDATION_ERROR" as const
}

// Document already exists error (for duplicate names)
export class DocumentAlreadyExistsError extends ConflictError {
  override readonly code = "DOCUMENT_ALREADY_EXISTS" as const

  constructor(name: string, context?: Record<string, unknown>) {
    super(`Document with name '${name}' already exists`, context)
  }
}

// Document file error (file not found, corrupted, etc.)
export class DocumentFileError extends ValidationError {
  override readonly code = "DOCUMENT_FILE_ERROR" as const

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, [], context)
  }
}

// Document permission error
export class DocumentPermissionError extends ValidationError {
  override readonly code = "DOCUMENT_PERMISSION_ERROR" as const

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, [], context)
  }
}

// Document upload error
export class DocumentUploadError extends ValidationError {
  override readonly code = "DOCUMENT_UPLOAD_ERROR" as const

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, [], context)
  }
}
