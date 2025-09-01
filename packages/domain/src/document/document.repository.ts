import type { Result } from "@carbonteq/fp"
import type { RepoResult } from "@domain/utils"
import type { DocumentEntity, DocumentType, DocumentUpdateType } from "./document.entity"
import type { DocumentNotFoundError, DocumentAlreadyExistsError } from "./document.errors"

export interface DocumentFilterQuery {
  name?: string
  mimeType?: string
  tags?: string[]
  metadata?: Record<string, string>
  fromDate?: Date
  toDate?: Date
  minSize?: number
  maxSize?: number
}

export interface DocumentPaginationParams {
  page: number
  limit: number
}

export abstract class DocumentRepository {
  // Essential CRUD operations
  abstract create(document: DocumentEntity): Promise<Result<DocumentEntity, DocumentAlreadyExistsError>>
  abstract update(document: DocumentEntity): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  abstract delete(id: DocumentType["id"]): Promise<Result<void, DocumentNotFoundError>>
  
  // Essential query operations
  abstract findById(id: DocumentType["id"]): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  abstract findByName(name: string): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  
  // Essential pagination and filtering
  abstract find(
    query?: DocumentFilterQuery, 
    pagination?: DocumentPaginationParams
  ): Promise<Result<DocumentEntity[], Error>>
  
  // Essential business operations
  abstract findByTags(tags: string[]): Promise<Result<DocumentEntity[], Error>>
  abstract findByMimeType(mimeType: string): Promise<Result<DocumentEntity[], Error>>
  abstract findByDateRange(fromDate: Date, toDate: Date): Promise<Result<DocumentEntity[], Error>>
  abstract findBySizeRange(minSize: number, maxSize: number): Promise<Result<DocumentEntity[], Error>>
  abstract exists(query: DocumentFilterQuery): Promise<Result<boolean, Error>>
  abstract count(query?: DocumentFilterQuery): Promise<Result<number, Error>>
  
  // DMS-specific operations
  abstract updateDocumentFields(
    id: DocumentType["id"], 
    updates: DocumentUpdateType
  ): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  
  // File operations
  abstract findByFilePath(filePath: string): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  
  // Search operations
  abstract searchDocuments(searchTerm: string): Promise<Result<DocumentEntity[], Error>>
  abstract findRecentDocuments(hours: number): Promise<Result<DocumentEntity[], Error>>
}
