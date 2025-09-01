import { describe, expect, it } from "bun:test"
import { DocumentEntity, DocumentSchema, NewDocumentSchema, DocumentUpdateSchema } from "@domain/document/document.entity"
import { Schema as S } from "effect"

describe("DocumentEntity", () => {
  describe("Schema Validation", () => {
    describe("DocumentSchema", () => {
      it("should validate a valid document", () => {
        // Create a valid document using the entity factory method instead of direct schema validation
        const document = DocumentEntity.create({
          name: "test-document.pdf",
          filePath: "/uploads/test-document.pdf",
          mimeType: "application/pdf",
          size: 1024,
          tags: ["pdf", "test"],
          metadata: { author: "test-user", category: "test" }
        })

        expect(document.name).toBe("test-document.pdf")
        expect(document.filePath).toBe("/uploads/test-document.pdf")
        expect(document.mimeType).toBe("application/pdf")
        expect(document.size).toBe(1024)
        expect(document.tags).toEqual(["pdf", "test"])
        expect(document.metadata).toEqual({ author: "test-user", category: "test" })
      })

      it("should reject empty name", () => {
        // Test with empty name - should fail at entity creation
        expect(() => {
          DocumentEntity.create({
            name: "",
            filePath: "/uploads/test.pdf",
            mimeType: "application/pdf",
            size: 1024
          })
        }).toThrow()
      })

      it("should reject name longer than 255 characters", () => {
        const longName = "a".repeat(256)
        // Test with long name - should fail at entity creation
        expect(() => {
          DocumentEntity.create({
            name: longName,
            filePath: "/uploads/test.pdf",
            mimeType: "application/pdf",
            size: 1024
          })
        }).toThrow()
      })

      it("should reject negative file size", () => {
        // Test with negative size - should fail at entity creation
        expect(() => {
          DocumentEntity.create({
            name: "test.pdf",
            filePath: "/uploads/test.pdf",
            mimeType: "application/pdf",
            size: -1024
          })
        }).toThrow()
      })

      it("should reject tag longer than 50 characters", () => {
        const longTag = "a".repeat(51)
        // Test with long tag - should fail at entity creation
        expect(() => {
          DocumentEntity.create({
            name: "test.pdf",
            filePath: "/uploads/test.pdf",
            mimeType: "application/pdf",
            size: 1024,
            tags: [longTag]
          })
        }).toThrow()
      })
    })

    describe("NewDocumentSchema", () => {
      it("should validate valid new document data", () => {
        const validNewDocument = {
          name: "new-document.pdf",
          filePath: "/uploads/new-document.pdf",
          mimeType: "application/pdf",
          size: 2048,
          tags: ["pdf", "new"],
          metadata: { author: "new-user" }
        }

        const result = S.decodeUnknownEither(NewDocumentSchema)(validNewDocument)
        expect(result._tag).toBe("Right")
      })

      it("should allow optional tags and metadata", () => {
        const minimalDocument = {
          name: "minimal.pdf",
          filePath: "/uploads/minimal.pdf",
          mimeType: "application/pdf",
          size: 512
        }

        const result = S.decodeUnknownEither(NewDocumentSchema)(minimalDocument)
        expect(result._tag).toBe("Right")
      })
    })

    describe("DocumentUpdateSchema", () => {
      it("should validate valid update data", () => {
        const validUpdate = {
          name: "updated-document.pdf",
          tags: ["pdf", "updated"]
        }

        const result = S.decodeUnknownEither(DocumentUpdateSchema)(validUpdate)
        expect(result._tag).toBe("Right")
      })

      it("should allow partial updates", () => {
        const partialUpdate = {
          name: "partial-update.pdf"
        }

        const result = S.decodeUnknownEither(DocumentUpdateSchema)(partialUpdate)
        expect(result._tag).toBe("Right")
      })
    })
  })

  describe("Factory Methods", () => {
    describe("create", () => {
      it("should create a new document with valid data", () => {
        const document = DocumentEntity.create({
          name: "new-doc.pdf",
          filePath: "/uploads/new-doc.pdf",
          mimeType: "application/pdf",
          size: 1024,
          tags: ["pdf", "new"],
          metadata: { author: "test-user" }
        })

        expect(document.name).toBe("new-doc.pdf")
        expect(document.filePath).toBe("/uploads/new-doc.pdf")
        expect(document.mimeType).toBe("application/pdf")
        expect(document.size).toBe(1024)
        expect(document.tags).toEqual(["pdf", "new"])
        expect(document.metadata).toEqual({ author: "test-user" })
        expect(document.id).toBeDefined()
        expect(document.createdAt).toBeDefined()
        expect(document.updatedAt).toBeDefined()
      })

      it("should create document without optional fields", () => {
        const document = DocumentEntity.create({
          name: "minimal.pdf",
          filePath: "/uploads/minimal.pdf",
          mimeType: "application/pdf",
          size: 512
        })

        expect(document.name).toBe("minimal.pdf")
        expect(document.tags).toEqual([])
        expect(document.metadata).toEqual({})
      })
    })

    describe("fromRepository", () => {
      it("should create document from repository data", () => {
        const repoData = {
          id: "doc-123",
          name: "repo-doc.pdf",
          filePath: "/uploads/repo-doc.pdf",
          mimeType: "application/pdf",
          size: 1024,
          tags: ["pdf", "repo"],
          metadata: { author: "repo-user" },
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02")
        }

        const document = DocumentEntity.fromRepository(repoData)

        expect(document.name).toBe("repo-doc.pdf")
        expect(document.filePath).toBe("/uploads/repo-doc.pdf")
        expect(document.mimeType).toBe("application/pdf")
        expect(document.size).toBe(1024)
        expect(document.tags).toEqual(["pdf", "repo"])
        expect(document.metadata).toEqual({ author: "repo-user" })
        expect(document.id).toBeDefined()
      })

      it("should handle empty tags and metadata", () => {
        const repoData = {
          id: "doc-123",
          name: "empty-doc.pdf",
          filePath: "/uploads/empty-doc.pdf",
          mimeType: "application/pdf",
          size: 1024,
          tags: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const document = DocumentEntity.fromRepository(repoData)

        expect(document.tags).toEqual([])
        expect(document.metadata).toEqual({})
      })
    })

    describe("from", () => {
      it("should create document from DocumentType data", () => {
        // Create a valid document first, then use its data
        const originalDocument = DocumentEntity.create({
          name: "from-doc.pdf",
          filePath: "/uploads/from-doc.pdf",
          mimeType: "application/pdf",
          size: 1024,
          tags: ["pdf", "from"],
          metadata: { author: "from-user" }
        })

        const document = DocumentEntity.from({
          id: originalDocument.id,
          name: originalDocument.name,
          filePath: originalDocument.filePath,
          mimeType: originalDocument.mimeType,
          size: originalDocument.size,
          tags: originalDocument.tags || [],
          metadata: originalDocument.metadata || {},
          createdAt: originalDocument.createdAt,
          updatedAt: originalDocument.updatedAt
        })

        expect(document.name).toBe("from-doc.pdf")
        expect(document.filePath).toBe("/uploads/from-doc.pdf")
        expect(document.mimeType).toBe("application/pdf")
        expect(document.size).toBe(1024)
      })
    })
  })

  describe("Business Methods", () => {
    it("should correctly identify PDF documents", () => {
      const pdfDocument = DocumentEntity.create({
        name: "test.pdf",
        filePath: "/uploads/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "test"],
        metadata: { author: "test-user" }
      })

      expect(pdfDocument.isPDF()).toBe(true)
      expect(pdfDocument.isDocument()).toBe(true)
      expect(pdfDocument.isImage()).toBe(false)
      expect(pdfDocument.isTextFile()).toBe(false)
    })

    it("should correctly identify image files", () => {
      const imageDocument = DocumentEntity.create({
        name: "test.jpg",
        filePath: "/uploads/test.jpg",
        mimeType: "image/jpeg",
        size: 2048,
        tags: ["image", "jpg"],
        metadata: { photographer: "test-photographer" }
      })

      expect(imageDocument.isImage()).toBe(true)
      expect(imageDocument.isPDF()).toBe(false)
      expect(imageDocument.isDocument()).toBe(false)
      expect(imageDocument.isTextFile()).toBe(false)
    })

    it("should correctly identify text files", () => {
      const textDocument = DocumentEntity.create({
        name: "test.txt",
        filePath: "/uploads/test.txt",
        mimeType: "text/plain",
        size: 512,
        tags: ["text", "plain"],
        metadata: { encoding: "utf-8" }
      })

      expect(textDocument.isTextFile()).toBe(true)
      expect(textDocument.isPDF()).toBe(false)
      expect(textDocument.isDocument()).toBe(false)
      expect(textDocument.isImage()).toBe(false)
    })

    it("should identify Word documents", () => {
      const wordDoc = DocumentEntity.create({
        name: "test.docx",
        filePath: "/uploads/test.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 1024
      })

      expect(wordDoc.isDocument()).toBe(true)
    })
  })

  describe("File Size Utilities", () => {
    it("should calculate file sizes correctly", () => {
      const document = DocumentEntity.create({
        name: "size-test.pdf",
        filePath: "/uploads/size-test.pdf",
        mimeType: "application/pdf",
        size: 1048576 // 1MB
      })

      expect(document.getFileSizeInBytes()).toBe(1048576)
      expect(document.getFileSizeInKB()).toBe(1024)
      expect(document.getFileSizeInMB()).toBe(1)
      expect(document.getFileSizeInGB()).toBe(1 / 1024)
    })
  })

  describe("Tag Operations", () => {
    it("should check for specific tags", () => {
      const pdfDocument = DocumentEntity.create({
        name: "test.pdf",
        filePath: "/uploads/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "test"],
        metadata: { author: "test-user" }
      })

      expect(pdfDocument.hasTag("pdf")).toBe(true)
      expect(pdfDocument.hasTag("test")).toBe(true)
      expect(pdfDocument.hasTag("nonexistent")).toBe(false)
      expect(pdfDocument.hasTag("PDF")).toBe(false) // Case sensitive
    })

    it("should check for any of multiple tags", () => {
      const pdfDocument = DocumentEntity.create({
        name: "test.pdf",
        filePath: "/uploads/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "test"],
        metadata: { author: "test-user" }
      })

      expect(pdfDocument.hasAnyTag(["pdf", "nonexistent"])).toBe(true)
      expect(pdfDocument.hasAnyTag(["nonexistent1", "nonexistent2"])).toBe(false)
    })

    it("should handle documents without tags", () => {
      const noTagsDoc = DocumentEntity.create({
        name: "no-tags.pdf",
        filePath: "/uploads/no-tags.pdf",
        mimeType: "application/pdf",
        size: 1024
      })

      expect(noTagsDoc.hasTag("any")).toBe(false)
      expect(noTagsDoc.hasAnyTag(["any", "tags"])).toBe(false)
    })
  })

  describe("Metadata Operations", () => {
    it("should check for metadata keys", () => {
      const pdfDocument = DocumentEntity.create({
        name: "test.pdf",
        filePath: "/uploads/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "test"],
        metadata: { author: "test-user" }
      })

      expect(pdfDocument.hasMetadata("author")).toBe(true)
      expect(pdfDocument.hasMetadata("nonexistent")).toBe(false)
    })

    it("should get metadata values", () => {
      const pdfDocument = DocumentEntity.create({
        name: "test.pdf",
        filePath: "/uploads/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "test"],
        metadata: { author: "test-user" }
      })

      expect(pdfDocument.getMetadataValue("author")).toBe("test-user")
      expect(pdfDocument.getMetadataValue("nonexistent")).toBeUndefined()
    })

    it("should handle documents without metadata", () => {
      const noMetadataDoc = DocumentEntity.create({
        name: "no-metadata.pdf",
        filePath: "/uploads/no-metadata.pdf",
        mimeType: "application/pdf",
        size: 1024
      })

      expect(noMetadataDoc.hasMetadata("any")).toBe(false)
      expect(noMetadataDoc.getMetadataValue("any")).toBeUndefined()
    })
  })

  describe("File Path Utilities", () => {
    it("should extract filename correctly", () => {
      const pdfDocument = DocumentEntity.create({
        name: "test.pdf",
        filePath: "/uploads/test.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "test"],
        metadata: { author: "test-user" }
      })

      const imageDocument = DocumentEntity.create({
        name: "test.jpg",
        filePath: "/uploads/test.jpg",
        mimeType: "image/jpeg",
        size: 2048
      })

      const textDocument = DocumentEntity.create({
        name: "test.txt",
        filePath: "/uploads/test.txt",
        mimeType: "text/plain",
        size: 512
      })

      expect(pdfDocument.getFileName()).toBe("test.pdf")
      expect(imageDocument.getFileName()).toBe("test.jpg")
      expect(textDocument.getFileName()).toBe("test.txt")
    })

    it("should extract file extension correctly", () => {
      const pdfDocument = DocumentEntity.create({
        name: "test.pdf",
        filePath: "/uploads/test.pdf",
        mimeType: "application/pdf",
        size: 1024
      })

      const imageDocument = DocumentEntity.create({
        name: "test.jpg",
        filePath: "/uploads/test.jpg",
        mimeType: "image/jpeg",
        size: 2048
      })

      const textDocument = DocumentEntity.create({
        name: "test.txt",
        filePath: "/uploads/test.txt",
        mimeType: "text/plain",
        size: 512
      })

      expect(pdfDocument.getFileExtension()).toBe("pdf")
      expect(imageDocument.getFileExtension()).toBe("jpg")
      expect(textDocument.getFileExtension()).toBe("txt")
    })

    it("should handle files without extensions", () => {
      const noExtDoc = DocumentEntity.create({
        name: "no-extension",
        filePath: "/uploads/no-extension",
        mimeType: "text/plain",
        size: 1024
      })

      expect(noExtDoc.getFileExtension()).toBe("")
    })

    it("should handle hidden files", () => {
      const hiddenDoc = DocumentEntity.create({
        name: ".hidden",
        filePath: "/uploads/.hidden",
        mimeType: "text/plain",
        size: 1024
      })

      expect(hiddenDoc.getFileExtension()).toBe("")
    })
  })

  describe("Update Methods", () => {
    it("should update name and return new instance", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.updateName("updated.pdf")

      expect(updatedDoc.name).toBe("updated.pdf")
      expect(updatedDoc).not.toBe(document) // Should be new instance
      expect(updatedDoc.id).toBe(document.id) // ID should remain same
      expect(updatedDoc.updatedAt).not.toEqual(document.updatedAt) // Should update timestamp
    })

    it("should update file info and return new instance", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.updateFileInfo(
        "/uploads/updated.pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        2048
      )

      expect(updatedDoc.filePath).toBe("/uploads/updated.pdf")
      expect(updatedDoc.mimeType).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      expect(updatedDoc.size).toBe(2048)
      expect(updatedDoc).not.toBe(document) // Should be new instance
      expect(updatedDoc.id).toBe(document.id) // ID should remain same
    })

    it("should update tags and return new instance", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const newTags = ["pdf", "updated", "new"]
      const updatedDoc = document.updateTags(newTags)

      expect(updatedDoc.tags).toEqual(newTags)
      expect(updatedDoc).not.toBe(document) // Should be new instance
      expect(updatedDoc.id).toBe(document.id) // ID should remain same
    })

    it("should handle empty tags array", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.updateTags([])

      expect(updatedDoc.tags).toEqual([])
      expect(updatedDoc).not.toBe(document) // Should be new instance
    })
  })

  describe("Tag Manipulation", () => {
    it("should add new tags to existing tags", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.addTags(["new", "additional"])

      expect(updatedDoc.tags).toEqual(["pdf", "original", "new", "additional"])
      expect(updatedDoc).not.toBe(document) // Should be new instance
    })

    it("should add tags to document without tags", () => {
      const noTagsDoc = DocumentEntity.create({
        name: "no-tags.pdf",
        filePath: "/uploads/no-tags.pdf",
        mimeType: "application/pdf",
        size: 1024
      })

      const updatedDoc = noTagsDoc.addTags(["new", "tags"])

      expect(updatedDoc.tags).toEqual(["new", "tags"])
      expect(updatedDoc).not.toBe(noTagsDoc) // Should be new instance
    })

    it("should remove specified tags", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.removeTags(["original"])

      expect(updatedDoc.tags).toEqual(["pdf"])
      expect(updatedDoc).not.toBe(document) // Should be new instance
    })

    it("should handle case-insensitive tag removal", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.removeTags(["PDF", "ORIGINAL"])

      expect(updatedDoc.tags).toEqual([])
      expect(updatedDoc).not.toBe(document) // Should be new instance
    })

    it("should return same instance if no tags to remove", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.removeTags(["nonexistent"])

      expect(updatedDoc.tags).toEqual(document.tags || [])
      expect(updatedDoc).toBe(document) // Should be same instance
    })
  })

  describe("Metadata Operations", () => {
    it("should update metadata and return new instance", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const newMetadata = { author: "updated-user", category: "updated" }
      const updatedDoc = document.updateMetadata(newMetadata)

      expect(updatedDoc.metadata).toEqual(newMetadata)
      expect(updatedDoc).not.toBe(document) // Should be new instance
      expect(updatedDoc.id).toBe(document.id) // ID should remain same
    })



    it("should handle empty metadata object", () => {
      const document = DocumentEntity.create({
        name: "original.pdf",
        filePath: "/uploads/original.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "original"],
        metadata: { author: "original-user" }
      })

      const updatedDoc = document.updateMetadata({})

      expect(updatedDoc.metadata).toEqual({})
      expect(updatedDoc).not.toBe(document) // Should be new instance
    })
  })

  describe("Utility Methods", () => {
    it("should check if document was recently updated", () => {
      const document = DocumentEntity.create({
        name: "recent.pdf",
        filePath: "/uploads/recent.pdf",
        mimeType: "application/pdf",
        size: 1024
      })

      // The document should be recently updated (within the last 24 hours)
      expect(document.isRecentlyUpdated(24)).toBe(true)
      
      // The document should also be recently updated within 1 hour
      expect(document.isRecentlyUpdated(1)).toBe(true)
    })

    it("should serialize document correctly", () => {
      const document = DocumentEntity.create({
        name: "serialize.pdf",
        filePath: "/uploads/serialize.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "serialize"],
        metadata: { author: "serialize-user" }
      })

      const serialized = document.serialize()
      expect(serialized).toBeDefined()
      expect(typeof serialized).toBe("object")
    })

    it("should convert to repository format", () => {
      const document = DocumentEntity.create({
        name: "repo.pdf",
        filePath: "/uploads/repo.pdf",
        mimeType: "application/pdf",
        size: 1024,
        tags: ["pdf", "repo"],
        metadata: { author: "repo-user" }
      })

      const repoFormat = document.toRepository()

      expect(repoFormat.id).toBe(document.id)
      expect(repoFormat.name).toBe(document.name)
      expect(repoFormat.filePath).toBe(document.filePath)
      expect(repoFormat.mimeType).toBe(document.mimeType)
      expect(repoFormat.size).toBe(document.size)
      expect(repoFormat.tags).toEqual([...(document.tags || [])])
      expect(repoFormat.metadata).toEqual(document.metadata || {})
      expect(repoFormat.createdAt).toBeDefined()
      expect(repoFormat.updatedAt).toBeDefined()
    })
  })

  describe("Edge Cases", () => {
    it("should handle very long filenames", () => {
      const longName = "a".repeat(255)
      const document = DocumentEntity.create({
        name: longName,
        filePath: `/uploads/${longName}`,
        mimeType: "application/pdf",
        size: 1024
      })

      expect(document.name).toBe(longName)
      expect(document.getFileName()).toBe(longName)
    })

    it("should handle files with multiple dots", () => {
      const document = DocumentEntity.create({
        name: "file.name.with.dots.pdf",
        filePath: "/uploads/file.name.with.dots.pdf",
        mimeType: "application/pdf",
        size: 1024
      })

      expect(document.getFileExtension()).toBe("pdf")
    })

    it("should handle files with spaces in path", () => {
      const document = DocumentEntity.create({
        name: "file with spaces.pdf",
        filePath: "/uploads/file with spaces.pdf",
        mimeType: "application/pdf",
        size: 1024
      })

      expect(document.getFileName()).toBe("file with spaces.pdf")
      expect(document.getFileExtension()).toBe("pdf")
    })
  })
})
