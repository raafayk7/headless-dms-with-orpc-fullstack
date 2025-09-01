import "reflect-metadata"
import { describe, it, expect, beforeEach } from "bun:test"
import { DocumentWorkflows } from "../src/workflows/document.workflow"
import { 
  UploadDocumentDto, 
  DocumentFiltersDto, 
  DocumentPaginationDto,
  PatchDocumentDto,
  GenerateDownloadTokenDto,
  DownloadDocumentByTokenDto
} from "../src/dtos/document.dto"
import { DocumentEntity } from "@domain/document"
import { DocumentRepository } from "@domain/document/document.repository"
import { DocumentNotFoundError, DocumentAlreadyExistsError } from "@domain/document/document.errors"
import { Result } from "@carbonteq/fp"
import { JwtService } from "../src/services/jwt.service"
import { StorageService } from "../../../apps/backend/src/infra/storage/storage.service"

// Mock JWT service for testing
class MockJwtService {
  private tokens: Map<string, string> = new Map()

  async generateToken(documentId: string, expiresInMinutes: number = 60): Promise<string> {
    const token = `mock-token-${documentId}-${Date.now()}`
    this.tokens.set(token, documentId)
    return token
  }

  async verifyToken(token: string): Promise<Result<string, Error>> {
    const documentId = this.tokens.get(token)
    if (!documentId) {
      return Result.Err(new Error("Invalid or expired token"))
    }
    return Result.Ok(documentId)
  }
}

// Mock storage service for testing
class MockStorageService {
  private files: Map<string, Buffer> = new Map()

  async upload(file: Buffer, fileName: string, mimeType: string): Promise<Result<string, Error>> {
    const filePath = `/uploads/${Date.now()}-${fileName}`
    this.files.set(filePath, file)
    return Result.Ok(filePath)
  }

  async download(filePath: string): Promise<Result<Buffer, Error>> {
    const file = this.files.get(filePath)
    if (!file) {
      return Result.Err(new Error("File not found"))
    }
    return Result.Ok(file)
  }

  async delete(filePath: string): Promise<Result<void, Error>> {
    if (!this.files.has(filePath)) {
      return Result.Err(new Error("File not found"))
    }
    this.files.delete(filePath)
    return Result.Ok(undefined)
  }
}

// Mock repository for testing
class MockDocumentRepository implements DocumentRepository {
  private documents: Map<string, DocumentEntity> = new Map()

  async create(document: DocumentEntity) {
    if (this.documents.has(document.name)) {
      return Result.Err(new DocumentAlreadyExistsError(document.name as any))
    }
    this.documents.set(document.id, document)
    return Result.Ok(document)
  }

  async update(document: DocumentEntity) {
    if (!this.documents.has(document.id)) {
      return Result.Err(new DocumentNotFoundError(document.id as any))
    }
    this.documents.set(document.id, document)
    return Result.Ok(document)
  }

  async delete(id: any) {
    const document = this.documents.get(id)
    if (!document) {
      return Result.Err(new DocumentNotFoundError(id as any))
    }
    this.documents.delete(id)
    return Result.Ok(undefined)
  }

  async findById(id: any) {
    const document = this.documents.get(id)
    if (!document) {
      return Result.Err(new DocumentNotFoundError(id as any))
    }
    return Result.Ok(document)
  }

  async findByName(name: string) {
    const document = Array.from(this.documents.values()).find(d => d.name === name)
    if (!document) {
      return Result.Err(new DocumentNotFoundError("unknown" as any))
    }
    return Result.Ok(document)
  }

  async findByFilePath(filePath: string) {
    const document = Array.from(this.documents.values()).find(d => d.filePath === filePath)
    if (!document) {
      return Result.Err(new DocumentNotFoundError("unknown" as any))
    }
    return Result.Ok(document)
  }

  async find(query?: any, pagination?: any) {
    let documents = Array.from(this.documents.values())

    // Apply filters if provided
    if (query) {
      if (query.name) {
        documents = documents.filter(d => d.name.includes(query.name))
      }
      if (query.mimeType) {
        documents = documents.filter(d => d.mimeType === query.mimeType)
      }
      if (query.tags && query.tags.length > 0) {
        documents = documents.filter(d => 
          query.tags.some((tag: string) => d.tags.includes(tag))
        )
      }
    }

    // Apply pagination if provided
    if (pagination) {
      const start = (pagination.page - 1) * pagination.limit
      const end = start + pagination.limit
      documents = documents.slice(start, end)
    }

    return Result.Ok(documents)
  }

  async findByTags(tags: string[]) {
    const documents = Array.from(this.documents.values()).filter(d => 
      tags.some(tag => d.tags.includes(tag))
    )
    return Result.Ok(documents)
  }

  async findByMimeType(mimeType: string) {
    const documents = Array.from(this.documents.values()).filter(d => d.mimeType === mimeType)
    return Result.Ok(documents)
  }

  async findByDateRange(fromDate: Date, toDate: Date) {
    const documents = Array.from(this.documents.values()).filter(d => 
      d.createdAt.epochMillis >= fromDate.getTime() && d.createdAt.epochMillis <= toDate.getTime()
    )
    return Result.Ok(documents)
  }

  async findBySizeRange(minSize: number, maxSize: number) {
    const documents = Array.from(this.documents.values()).filter(d => 
      d.size >= minSize && d.size <= maxSize
    )
    return Result.Ok(documents)
  }

  async updateDocumentFields() {
    return Result.Err(new DocumentNotFoundError("unknown" as any))
  }

  async searchDocuments() {
    return Result.Ok([])
  }

  async findRecentDocuments() {
    return Result.Ok([])
  }
}

describe("DocumentWorkflows", () => {
  let documentWorkflows: DocumentWorkflows
  let mockRepository: MockDocumentRepository
  let mockStorageService: MockStorageService
  let mockJwtService: MockJwtService

  beforeEach(() => {
    mockRepository = new MockDocumentRepository()
    mockStorageService = new MockStorageService()
    mockJwtService = new MockJwtService()
    documentWorkflows = new DocumentWorkflows(
      mockRepository,
      mockStorageService as any,
      mockJwtService as any
    )
  })

  describe("uploadDocument", () => {
    it("should upload a document successfully", async () => {
      const fileBuffer = Buffer.from("test file content")
      const uploadDto = UploadDocumentDto.create({
        name: "test-document.txt",
        file: fileBuffer,
        tags: ["test", "document"],
        metadata: { category: "test", author: "tester" }
      })

      if (uploadDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await documentWorkflows.uploadDocument(uploadDto.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const document = result.unwrap()
        expect(document.name).toBe("test-document.txt")
        expect(document.mimeType).toBe("text/plain")
        expect(document.size).toBe(fileBuffer.length)
        expect(document.tags).toEqual(["test", "document"])
        expect(document.metadata).toEqual({ category: "test", author: "tester" })
      }
    })

    it("should upload document without optional fields", async () => {
      const fileBuffer = Buffer.from("test file content")
      const uploadDto = UploadDocumentDto.create({
        name: "test-document.txt",
        file: fileBuffer
      })

      if (uploadDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await documentWorkflows.uploadDocument(uploadDto.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const document = result.unwrap()
        expect(document.name).toBe("test-document.txt")
        expect(document.tags).toEqual([])
        expect(document.metadata).toEqual({})
      }
    })
  })

  describe("getDocuments", () => {
    beforeEach(async () => {
      // Upload some test documents
      const fileBuffer = Buffer.from("test content")
      
      const doc1 = UploadDocumentDto.create({
        name: "document1.pdf",
        file: fileBuffer,
        tags: ["pdf", "important"],
        metadata: { category: "documents" }
      })

      const doc2 = UploadDocumentDto.create({
        name: "document2.txt",
        file: fileBuffer,
        tags: ["text", "simple"],
        metadata: { category: "text" }
      })

      if (doc1.isOk()) await documentWorkflows.uploadDocument(doc1.unwrap())
      if (doc2.isOk()) await documentWorkflows.uploadDocument(doc2.unwrap())
    })

    it("should get all documents without filters", async () => {
      const result = await documentWorkflows.getDocuments()
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const documents = result.unwrap()
        expect(documents.length).toBe(2)
      }
    })

    it("should filter documents by name", async () => {
      const filters = DocumentFiltersDto.create({
        name: "document1"
      })

      if (filters.isErr()) {
        throw new Error("Failed to create filters")
      }

      const result = await documentWorkflows.getDocuments(filters.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const documents = result.unwrap()
        expect(documents.length).toBe(1)
        expect(documents[0].name).toBe("document1.pdf")
      }
    })

    it("should filter documents by mime type", async () => {
      const filters = DocumentFiltersDto.create({
        mimeType: "application/pdf"
      })

      if (filters.isErr()) {
        throw new Error("Failed to create filters")
      }

      const result = await documentWorkflows.getDocuments(filters.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const documents = result.unwrap()
        expect(documents.length).toBe(1)
        expect(documents[0].mimeType).toBe("application/pdf")
      }
    })

    it("should filter documents by tags", async () => {
      const filters = DocumentFiltersDto.create({
        tags: ["important"]
      })

      if (filters.isErr()) {
        throw new Error("Failed to create filters")
      }

      const result = await documentWorkflows.getDocuments(filters.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const documents = result.unwrap()
        expect(documents.length).toBe(1)
        expect(documents[0].tags).toContain("important")
      }
    })

    it("should apply pagination", async () => {
      const pagination = DocumentPaginationDto.create({
        page: 1,
        limit: 1
      })

      if (pagination.isErr()) {
        throw new Error("Failed to create pagination")
      }

      const result = await documentWorkflows.getDocuments(undefined, pagination.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const documents = result.unwrap()
        expect(documents.length).toBe(1)
      }
    })
  })

  describe("getDocumentById", () => {
    it("should get document by ID", async () => {
      // First upload a document
      const fileBuffer = Buffer.from("test content")
      const uploadDto = UploadDocumentDto.create({
        name: "test-document.txt",
        file: fileBuffer
      })

      if (uploadDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const uploadResult = await documentWorkflows.uploadDocument(uploadDto.unwrap())
      if (!uploadResult.isOk()) {
        throw new Error("Failed to upload document")
      }

      const documentId = uploadResult.unwrap().id
      const result = await documentWorkflows.getDocumentById(documentId)
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const document = result.unwrap()
        expect(document.name).toBe("test-document.txt")
      }
    })

    it("should fail for non-existent document", async () => {
      const result = await documentWorkflows.getDocumentById("non-existent-id")
      
      expect(result.isErr()).toBe(true)
    })
  })

  describe("patchDocument", () => {
    let documentId: string

    beforeEach(async () => {
      // Upload a test document
      const fileBuffer = Buffer.from("test content")
      const uploadDto = UploadDocumentDto.create({
        name: "original-name.txt",
        file: fileBuffer,
        tags: ["original"],
        metadata: { original: "true" }
      })

      if (uploadDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const uploadResult = await documentWorkflows.uploadDocument(uploadDto.unwrap())
      if (!uploadResult.isOk()) {
        throw new Error("Failed to upload document")
      }

      documentId = uploadResult.unwrap().id
    })

    it("should patch document name", async () => {
      const patchDto = PatchDocumentDto.create({
        name: "updated-name.txt"
      })

      if (patchDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await documentWorkflows.patchDocument(documentId, patchDto.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const document = result.unwrap()
        expect(document.name).toBe("updated-name.txt")
        expect(document.tags).toEqual(["original"]) // Should remain unchanged
        expect(document.metadata).toEqual({ original: "true" }) // Should remain unchanged
      }
    })

    it("should replace tags completely", async () => {
      const patchDto = PatchDocumentDto.create({
        tags: ["new", "tags"]
      })

      if (patchDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await documentWorkflows.patchDocument(documentId, patchDto.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const document = result.unwrap()
        expect(document.name).toBe("original-name.txt") // Should remain unchanged
        expect(document.tags).toEqual(["new", "tags"]) // Should be replaced
        expect(document.metadata).toEqual({ original: "true" }) // Should remain unchanged
      }
    })

    it("should replace metadata completely", async () => {
      const patchDto = PatchDocumentDto.create({
        metadata: { new: "metadata", updated: "true" }
      })

      if (patchDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await documentWorkflows.patchDocument(documentId, patchDto.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const document = result.unwrap()
        expect(document.name).toBe("original-name.txt") // Should remain unchanged
        expect(document.tags).toEqual(["original"]) // Should remain unchanged
        expect(document.metadata).toEqual({ new: "metadata", updated: "true" }) // Should be replaced
      }
    })

    it("should fail for non-existent document", async () => {
      const patchDto = PatchDocumentDto.create({
        name: "updated-name.txt"
      })

      if (patchDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await documentWorkflows.patchDocument("non-existent-id", patchDto.unwrap())
      
      expect(result.isErr()).toBe(true)
    })
  })

  describe("deleteDocument", () => {
    it("should delete document successfully", async () => {
      // First upload a document
      const fileBuffer = Buffer.from("test content")
      const uploadDto = UploadDocumentDto.create({
        name: "test-document.txt",
        file: fileBuffer
      })

      if (uploadDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const uploadResult = await documentWorkflows.uploadDocument(uploadDto.unwrap())
      if (!uploadResult.isOk()) {
        throw new Error("Failed to upload document")
      }

      const documentId = uploadResult.unwrap().id
      const result = await documentWorkflows.deleteDocument(documentId)
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const data = result.unwrap()
        expect(data.success).toBe(true)
        expect(data.message).toBe("Document deleted successfully")
      }
    })

    it("should fail for non-existent document", async () => {
      const result = await documentWorkflows.deleteDocument("non-existent-id")
      
      expect(result.isErr()).toBe(true)
    })
  })

  describe("generateDownloadToken", () => {
    let documentId: string

    beforeEach(async () => {
      // Upload a test document
      const fileBuffer = Buffer.from("test content")
      const uploadDto = UploadDocumentDto.create({
        name: "test-document.txt",
        file: fileBuffer
      })

      if (uploadDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const uploadResult = await documentWorkflows.uploadDocument(uploadDto.unwrap())
      if (!uploadResult.isOk()) {
        throw new Error("Failed to upload document")
      }

      documentId = uploadResult.unwrap().id
    })

    it("should generate download token", async () => {
      const result = await documentWorkflows.generateDownloadToken(documentId)
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const token = result.unwrap()
        expect(token).toContain("mock-token-")
        expect(token).toContain(documentId)
      }
    })

    it("should generate token with custom expiry", async () => {
      const result = await documentWorkflows.generateDownloadToken(documentId, 120)
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const token = result.unwrap()
        expect(token).toContain("mock-token-")
        expect(token).toContain(documentId)
      }
    })

    it("should fail for non-existent document", async () => {
      const result = await documentWorkflows.generateDownloadToken("non-existent-id")
      
      expect(result.isErr()).toBe(true)
    })
  })

  describe("downloadDocumentByToken", () => {
    let documentId: string
    let token: string

    beforeEach(async () => {
      // Upload a test document
      const fileBuffer = Buffer.from("test content")
      const uploadDto = UploadDocumentDto.create({
        name: "test-document.txt",
        file: fileBuffer
      })

      if (uploadDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const uploadResult = await documentWorkflows.uploadDocument(uploadDto.unwrap())
      if (!uploadResult.isOk()) {
        throw new Error("Failed to upload document")
      }

      documentId = uploadResult.unwrap().id

      // Generate a token
      const tokenResult = await documentWorkflows.generateDownloadToken(documentId)
      if (!tokenResult.isOk()) {
        throw new Error("Failed to generate token")
      }

      token = tokenResult.unwrap()
    })

    it("should download document with valid token", async () => {
      const result = await documentWorkflows.downloadDocumentByToken(token)
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const data = result.unwrap()
        expect(data.document.id).toBe(documentId)
        expect(data.document.name).toBe("test-document.txt")
        expect(data.file).toBeInstanceOf(Buffer)
        expect(data.file.toString()).toBe("test content")
      }
    })

    it("should fail with invalid token", async () => {
      const result = await documentWorkflows.downloadDocumentByToken("invalid-token")
      
      expect(result.isErr()).toBe(true)
    })
  })
})
