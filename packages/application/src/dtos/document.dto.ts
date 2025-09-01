import { simpleSchemaDto } from "@application/utils/validation.utils"
import { Schema as S } from "effect"

// Upload document DTO (formdata: name, file, tags?, metadata?)
export const UploadDocumentDtoSchema = S.Struct({
  name: S.String.pipe(S.minLength(1), S.maxLength(255)),
  file: S.instanceOf(Buffer),
  tags: S.optional(S.Array(S.String.pipe(S.minLength(1), S.maxLength(50)))),
  metadata: S.optional(S.Record({ key: S.String, value: S.String })),
})

export class UploadDocumentDto extends simpleSchemaDto(
  "UploadDocumentDto",
  UploadDocumentDtoSchema,
) {}

// Document filters for getDocuments
export const DocumentFiltersSchema = S.Struct({
  name: S.optional(S.String),
  mimeType: S.optional(S.String),
  tags: S.optional(S.Array(S.String)),
  metadata: S.optional(S.Record({ key: S.String, value: S.String })),
})

export class DocumentFiltersDto extends simpleSchemaDto(
  "DocumentFiltersDto",
  DocumentFiltersSchema,
) {}

// Pagination parameters for getDocuments
export const DocumentPaginationSchema = S.Struct({
  page: S.Number.pipe(S.greaterThan(0)),
  limit: S.Number.pipe(S.greaterThan(0)).pipe(S.lessThanOrEqualTo(100)),
})

export class DocumentPaginationDto extends simpleSchemaDto(
  "DocumentPaginationDto",
  DocumentPaginationSchema,
) {}

// Get document by ID DTO
export const GetDocumentByIdDtoSchema = S.Struct({
  id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
})

export class GetDocumentByIdDto extends simpleSchemaDto(
  "GetDocumentByIdDto",
  GetDocumentByIdDtoSchema,
) {}

// Patch document DTO (name?, tags?, metadata? - replaces if provided)
export const PatchDocumentDtoSchema = S.Struct({
  name: S.optional(S.String.pipe(S.minLength(1), S.maxLength(255))),
  tags: S.optional(S.Array(S.String.pipe(S.minLength(1), S.maxLength(50)))),
  metadata: S.optional(S.Record({ key: S.String, value: S.String })),
})

export class PatchDocumentDto extends simpleSchemaDto(
  "PatchDocumentDto",
  PatchDocumentDtoSchema,
) {}

// Delete document DTO
export const DeleteDocumentDtoSchema = S.Struct({
  id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
})

export class DeleteDocumentDto extends simpleSchemaDto(
  "DeleteDocumentDto",
  DeleteDocumentDtoSchema,
) {}

// Generate download token DTO
export const GenerateDownloadTokenDtoSchema = S.Struct({
  documentId: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
  expiresInMinutes: S.optional(S.Number.pipe(S.greaterThan(0)).pipe(S.lessThanOrEqualTo(1440))), // 1 minute to 24 hours
})

export class GenerateDownloadTokenDto extends simpleSchemaDto(
  "GenerateDownloadTokenDto",
  GenerateDownloadTokenDtoSchema,
) {}

// Download document by token DTO
export const DownloadDocumentByTokenDtoSchema = S.Struct({
  token: S.String.pipe(S.minLength(1)),
})

export class DownloadDocumentByTokenDto extends simpleSchemaDto(
  "DownloadDocumentByTokenDto",
  DownloadDocumentByTokenDtoSchema,
) {}
