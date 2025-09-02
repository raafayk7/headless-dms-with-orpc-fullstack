import { appPublicBase, appAuthenticatedBase, appAdminBase } from "@contract/utils/oc.base"
import { dtoStandardSchema } from "@application/utils/validation.utils"
import { 
  UploadDocumentDto,
  PatchDocumentDto,
  GenerateDownloadTokenDto,
  DownloadDocumentByTokenDto,
  PatchDocumentDtoSchema
} from "@application/dtos/document.dto"
import { type } from "@orpc/contract"
import { Schema as S } from "effect"

const documentBase = appAuthenticatedBase
// Get documents with filtering and pagination (authenticated)
export const getDocuments = documentBase
  .route({
    method: "GET",
    path: "/document",
    summary: "Get documents with optional filtering and pagination",
    tags: ["document"],
  })
  .input(S.standardSchemaV1(S.Struct({
    page: S.optional(S.NumberFromString.pipe(S.greaterThan(0))),
    limit: S.optional(S.NumberFromString.pipe(S.greaterThan(0)).pipe(S.lessThanOrEqualTo(100))),
    name: S.optional(S.String),
    mimeType: S.optional(S.String),
    tags: S.optional(S.String), // Comma-separated tags
    metadata: S.optional(S.String), // JSON string or key=value format
    // Individual metadata key-value pairs for easier querying
    metadataKey: S.optional(S.String), // Single metadata key
    metadataValue: S.optional(S.String), // Single metadata value
  })))
  .output(S.standardSchemaV1(S.Struct({
    documents: S.Array(S.Struct({
      id: S.String,
      name: S.String,
      filePath: S.String,
      mimeType: S.String,
      size: S.Number,
      tags: S.optional(S.Array(S.String)),
      metadata: S.optional(S.Record({ key: S.String, value: S.String })),
      createdAt: S.Date,
      updatedAt: S.Date,
    })),
    pagination: S.Struct({
      page: S.Number,
      limit: S.Number,
      total: S.Number,
      totalPages: S.Number,
    })
  })))

// Get document by ID (authenticated)
export const getDocumentById = documentBase
  .route({
    method: "GET",
    path: "/document/:id",
    summary: "Get document by ID",
    tags: ["document"],
    inputStructure: "detailed",
  })
  .input(S.standardSchemaV1(S.Struct({
    params: S.Struct({
      id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
    })
  })))
  .output(S.standardSchemaV1(S.Struct({
    id: S.String,
    name: S.String,
    filePath: S.String,
    mimeType: S.String,
    size: S.Number,
    tags: S.optional(S.Array(S.String)),
    metadata: S.optional(S.Record({ key: S.String, value: S.String })),
    createdAt: S.Date,
    updatedAt: S.Date,
  })))

// Upload document (admin only)
export const uploadDocument = documentBase
  .route({
    method: "POST",
    path: "/document/upload",
    summary: "Upload document (admin only)",
    tags: ["document"],
  })
  .input(dtoStandardSchema(UploadDocumentDto))
  .output(S.standardSchemaV1(S.Struct({
    id: S.String,
    name: S.String,
    filePath: S.String,
    mimeType: S.String,
    size: S.Number,
    tags: S.optional(S.Array(S.String)),
    metadata: S.optional(S.Record({ key: S.String, value: S.String })),
    createdAt: S.Date,
    updatedAt: S.Date,
  })))

// Update document (admin only)
export const updateDocument = documentBase
  .route({
    method: "PATCH",
    path: "/document/:id",
    summary: "Update document (admin only)",
    tags: ["document"],
    inputStructure: "detailed",
  })
  .input(S.standardSchemaV1(S.Struct({
    params: S.Struct({
      id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
    }),
    body: PatchDocumentDtoSchema
  })))
  .output(S.standardSchemaV1(S.Struct({
    id: S.String,
    name: S.String,
    filePath: S.String,
    mimeType: S.String,
    size: S.Number,
    tags: S.optional(S.Array(S.String)),
    metadata: S.optional(S.Record({ key: S.String, value: S.String })),
    createdAt: S.Date,
    updatedAt: S.Date,
  })))

// Generate download link (authenticated)
export const generateDownloadLink = documentBase
  .route({
    method: "GET",
    path: "/document/:id/download-link",
    summary: "Generate download link for document",
    tags: ["document"],
    inputStructure: "detailed",
  })
  .input(S.standardSchemaV1(S.Struct({
    params: S.Struct({
      id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
    })
  })))
  .output(S.standardSchemaV1(S.Struct({
    downloadUrl: S.String,
    expiresAt: S.Date,
  })))



// Delete document (admin only)
export const deleteDocument = documentBase
  .route({
    method: "DELETE",
    path: "/document/:id",
    summary: "Delete document (admin only)",
    tags: ["document"],
    inputStructure: "detailed",
  })
  .input(S.standardSchemaV1(S.Struct({
    params: S.Struct({
      id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
    })
  })))
  .output(S.standardSchemaV1(S.Struct({
    success: S.Boolean,
    message: S.String,
  })))

export default {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  generateDownloadLink,
  deleteDocument,
}
