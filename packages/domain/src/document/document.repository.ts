import type { Result } from "@carbonteq/fp"
import type { RepoResult } from "@domain/utils"
import type { DocumentEntity, DocumentType, DocumentUpdateType } from "./document.entity"
import type { DocumentNotFoundError, DocumentAlreadyExistsError } from "./document.errors"

export interface DocumentFilterQuery {
  name?: string
  mimeType?: string
  tags?: string[]
  fromDate?: Date
  toDate?: Date
  minSize?: number
  maxSize?: number
}

export interface DocumentRepository {
  // Essential CRUD operations
  create(document: DocumentEntity): Promise<Result<DocumentEntity, DocumentAlreadyExistsError>>
  update(document: DocumentEntity): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  delete(id: DocumentType["id"]): Promise<Result<void, DocumentNotFoundError>>
  
  // Essential query operations
  findById(id: DocumentType["id"]): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  findByName(name: string): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  
  // Essential pagination and filtering
  find(query?: DocumentFilterQuery, pagination?: { page: number; limit: number }): Promise<Result<DocumentEntity[], Error>>
  
  // Essential business operations
  findByTags(tags: string[]): Promise<Result<DocumentEntity[], Error>>
  findByMimeType(mimeType: string): Promise<Result<DocumentEntity[], Error>>
  findByDateRange(fromDate: Date, toDate: Date): Promise<Result<DocumentEntity[], Error>>
  findBySizeRange(minSize: number, maxSize: number): Promise<Result<DocumentEntity[], Error>>
  exists(query: DocumentFilterQuery): Promise<Result<boolean, Error>>
  count(query?: DocumentFilterQuery): Promise<Result<number, Error>>
  
  // DMS-specific operations
  updateDocumentFields(
    id: DocumentType["id"], 
    updates: DocumentUpdateType
  ): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  
  // File operations
  findByFilePath(filePath: string): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>>
  findDocumentsByUser(userId: string): Promise<Result<DocumentEntity[], Error>>
  
  // Search operations
  searchDocuments(searchTerm: string): Promise<Result<DocumentEntity[], Error>>
  findRecentDocuments(hours: number): Promise<Result<DocumentEntity[], Error>>
}
