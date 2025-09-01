import {
  UploadDocumentDto,
  GetDocumentByIdDto,
  PatchDocumentDto,
  DeleteDocumentDto,
  GenerateDownloadTokenDto,
  DownloadDocumentByTokenDto,
  DocumentFiltersDto,
  DocumentPaginationDto,
} from "@application/dtos/document.dto"
import { ApplicationResult } from "@application/utils/application-result.utils"
import { Result } from "@carbonteq/fp"
import { DocumentEntity, DocumentRepository } from "@domain/document"
import type { DocumentType } from "@domain/document"
import { DocumentNotFoundError } from "@domain/document/document.errors"
import { autoInjectable } from "tsyringe"
import { JwtService } from "@application/services/jwt.service"
import { StorageService } from "../../../../apps/backend/src/infra/storage/storage.service"

@autoInjectable()
export class DocumentWorkflows {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Upload document (this IS creation - no separate create method)
   */
  async uploadDocument(dto: UploadDocumentDto): Promise<ApplicationResult<DocumentEntity>> {
    try {
      // 1. Save file to storage
      const uploadResult = await this.storageService.upload(
        dto.data.file,
        dto.data.name,
        this.getMimeType(dto.data.file, dto.data.name)
      )

      if (uploadResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error(`Failed to upload file: ${uploadResult.unwrapErr().message}`))
        )
      }

      const filePath = uploadResult.unwrap()

      // 2. Create document entity
      const document = DocumentEntity.create({
        name: dto.data.name,
        filePath,
        mimeType: this.getMimeType(dto.data.file, dto.data.name),
        size: dto.data.file.length,
        tags: dto.data.tags,
        metadata: dto.data.metadata,
      })

      // 3. Save to repository
      const saveResult = await this.documentRepository.create(document)
      
      return ApplicationResult.fromResult(saveResult)
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to upload document"))
      )
    }
  }

  /**
   * Get documents with optional filtering and pagination
   */
  async getDocuments(
    filters?: DocumentFiltersDto,
    pagination?: DocumentPaginationDto
  ): Promise<ApplicationResult<DocumentEntity[]>> {
    try {
      const filterQuery = filters ? {
        name: filters.data.name,
        mimeType: filters.data.mimeType,
        tags: filters.data.tags ? [...filters.data.tags] : undefined,
        metadata: filters.data.metadata ? { ...filters.data.metadata } : undefined,
      } : undefined

      const paginationParams = pagination ? {
        page: pagination.data.page,
        limit: pagination.data.limit,
      } : undefined

      const documentsResult = await this.documentRepository.find(filterQuery, paginationParams)
      
      return ApplicationResult.fromResult(documentsResult)
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to get documents"))
      )
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<ApplicationResult<DocumentEntity>> {
    try {
      const documentResult = await this.documentRepository.findById(id as DocumentType["id"])
      return ApplicationResult.fromResult(documentResult)
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to get document"))
      )
    }
  }

  /**
   * Patch document (replaces tags/metadata if provided, doesn't add to existing)
   */
  async patchDocument(
    id: string,
    dto: PatchDocumentDto
  ): Promise<ApplicationResult<DocumentEntity>> {
    try {
      // Get existing document
      const documentResult = await this.documentRepository.findById(id as DocumentType["id"])
      if (documentResult.isErr()) {
        return ApplicationResult.fromResult(documentResult)
      }

      const document = documentResult.unwrap()

      // Apply patches
      let updatedDocument = document

      if (dto.data.name !== undefined) {
        updatedDocument = updatedDocument.updateName(dto.data.name)
      }

      if (dto.data.tags !== undefined) {
        // Replace tags (not add to existing)
        updatedDocument = updatedDocument.updateTags([...dto.data.tags])
      }

      if (dto.data.metadata !== undefined) {
        // Replace metadata (not add to existing)
        updatedDocument = updatedDocument.updateMetadata(dto.data.metadata)
      }

      // Save updated document
      const saveResult = await this.documentRepository.update(updatedDocument)
      return ApplicationResult.fromResult(saveResult)
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to patch document"))
      )
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<ApplicationResult<{ success: boolean; message: string }>> {
    try {
      // Get document to get file path
      const documentResult = await this.documentRepository.findById(id as DocumentType["id"])
      if (documentResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new DocumentNotFoundError(id as DocumentType["id"]))
        )
      }

      const document = documentResult.unwrap()

      // Delete file from storage
      const deleteFileResult = await this.storageService.delete(document.filePath)
      if (deleteFileResult.isErr()) {
        // Log error but continue with database deletion
        console.error("Failed to delete file from storage:", deleteFileResult.unwrapErr())
      }

      // Delete from repository
      const deleteResult = await this.documentRepository.delete(id as DocumentType["id"])

      return ApplicationResult.fromResult(
        deleteResult.map(() => ({
          success: true,
          message: "Document deleted successfully"
        }))
      )
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to delete document"))
      )
    }
  }

  /**
   * Generate download token
   */
  async generateDownloadToken(
    documentId: string,
    expiresInMinutes: number = 5
  ): Promise<ApplicationResult<string>> {
    try {
      // Verify document exists
      const documentResult = await this.documentRepository.findById(documentId as DocumentType["id"])
      if (documentResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new DocumentNotFoundError(documentId as DocumentType["id"]))
        )
      }

      // Generate token
      const token = await this.jwtService.generateToken(documentId, expiresInMinutes)

      return ApplicationResult.fromResult(Result.Ok(token))
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to generate download token"))
      )
    }
  }

  /**
   * Download document by token
   */
  async downloadDocumentByToken(token: string): Promise<ApplicationResult<{ document: DocumentEntity; file: Buffer }>> {
    try {
      // Verify and decode token
      const documentIdResult = await this.jwtService.verifyToken(token)
      if (documentIdResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error("Invalid or expired download token"))
        )
      }

      const documentId = documentIdResult.unwrap()

      // Get document
      const documentResult = await this.documentRepository.findById(documentId as DocumentType["id"])
      if (documentResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new DocumentNotFoundError(documentId as DocumentType["id"]))
        )
      }

      const document = documentResult.unwrap()

      // Download file from storage
      const fileResult = await this.storageService.download(document.filePath)
      if (fileResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error(`Failed to download file: ${fileResult.unwrapErr().message}`))
        )
      }

      const file = fileResult.unwrap()

      return ApplicationResult.fromResult(
        Result.Ok({ document, file })
      )
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to download document"))
      )
    }
  }

  /**
   * Helper method to determine MIME type from file buffer and name
   */
  private getMimeType(file: Buffer, fileName: string): string {
    // Simple MIME type detection based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'zip': 'application/zip',
      'rar': 'application/vnd.rar',
      '7z': 'application/x-7z-compressed',
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }
}
