import { BaseEntity, defineEntityStruct } from "@domain/utils/base.entity"
import { createEncoderDecoderBridge } from "@domain/utils/schema-utils"
import { Schema as S } from "effect"

// Define the Document schema with DMS-specific fields
export const DocumentSchema = defineEntityStruct("DocumentId", {
  name: S.String.pipe(S.minLength(1), S.maxLength(255)),
  filePath: S.String.pipe(S.minLength(1)),
  mimeType: S.String.pipe(S.minLength(1)),
  size: S.Number.pipe(S.positive()),
  tags: S.optional(S.Array(S.String.pipe(S.minLength(1), S.maxLength(50)))),
  metadata: S.optional(S.Record({key:S.String, value:S.String})),
})

export const DocumentIdSchema = DocumentSchema.id

export type DocumentType = S.Schema.Type<typeof DocumentSchema>
export type DocumentEncoded = S.Schema.Encoded<typeof DocumentSchema>

// Schema for creating new documents
export const NewDocumentSchema = DocumentSchema.pipe(
  S.pick("name", "filePath", "mimeType", "size"),
  S.extend(
    S.Struct({
      tags: S.optional(S.Array(S.String.pipe(S.minLength(1), S.maxLength(50)))),
      metadata: S.optional(S.Record({key:S.String, value:S.String})),
    }),
  ),
)
export type NewDocumentType = S.Schema.Type<typeof NewDocumentSchema>
export type NewDocumentEncoded = S.Schema.Encoded<typeof NewDocumentSchema>

// Schema for document updates
export const DocumentUpdateSchema = S.Struct({
  name: S.optional(S.String.pipe(S.minLength(1), S.maxLength(255))),
  filePath: S.optional(S.String.pipe(S.minLength(1))),
  mimeType: S.optional(S.String.pipe(S.minLength(1))),
  size: S.optional(S.Number.pipe(S.positive())),
  tags: S.optional(S.Array(S.String.pipe(S.minLength(1), S.maxLength(50)))),
  metadata: S.optional(S.Record({key:S.String, value:S.String})),
})
export type DocumentUpdateType = S.Schema.Type<typeof DocumentUpdateSchema>

const bridge = createEncoderDecoderBridge(DocumentSchema)

export class DocumentEntity extends BaseEntity implements DocumentType {
  override readonly id: DocumentType["id"]

  readonly name: string
  readonly filePath: string
  readonly mimeType: string
  readonly size: number
  readonly tags: DocumentType["tags"]
  readonly metadata: DocumentType["metadata"]

  private constructor(data: DocumentType) {
    super(data)
    this.id = data.id
    this.name = data.name
    this.filePath = data.filePath
    this.mimeType = data.mimeType
    this.size = data.size
    this.tags = data.tags
    this.metadata = data.metadata
  }

  static from(data: DocumentType): DocumentEntity {
    return new DocumentEntity(data)
  }

  static fromEncoded(data: DocumentEncoded) {
    return bridge.deserialize(data).map((documentData) => new DocumentEntity(documentData))
  }

  // Factory method for creating new documents
  static create(data: NewDocumentType): DocumentEntity {
    const documentData: DocumentType = {
      ...DocumentSchema.baseInit(),
      name: data.name,
      filePath: data.filePath,
      mimeType: data.mimeType,
      size: data.size,
      tags: data.tags,
      metadata: data.metadata,
    }
    return new DocumentEntity(documentData)
  }

  // Factory method for creating from repository data
  static fromRepository(data: {
    id: string
    name: string
    filePath: string
    mimeType: string
    size: number
    tags: string[]
    metadata: Record<string, string>
    createdAt: Date
    updatedAt: Date
  }): DocumentEntity {
    const documentData: DocumentType = {
      id: DocumentIdSchema.new(),
      name: data.name,
      filePath: data.filePath,
      mimeType: data.mimeType,
      size: data.size,
      tags: data.tags.length > 0 ? data.tags : undefined,
      metadata: Object.keys(data.metadata).length > 0 ? data.metadata : undefined,
      createdAt: data.createdAt as any, // Type assertion for now
      updatedAt: data.updatedAt as any, // Type assertion for now
    }
    return new DocumentEntity(documentData)
  }

  // Business methods
  isImage(): boolean {
    return this.mimeType.startsWith('image/')
  }

  isPDF(): boolean {
    return this.mimeType === 'application/pdf'
  }

  isTextFile(): boolean {
    return this.mimeType.startsWith('text/')
  }

  isDocument(): boolean {
    return this.isPDF() || this.mimeType.includes('document') || this.mimeType.includes('word')
  }

  // File size utilities
  getFileSizeInBytes(): number {
    return this.size
  }

  getFileSizeInKB(): number {
    return this.size / 1024
  }

  getFileSizeInMB(): number {
    return this.size / (1024 * 1024)
  }

  getFileSizeInGB(): number {
    return this.size / (1024 * 1024 * 1024)
  }

  // Tag operations
  hasTag(tag: string): boolean {
    if (!this.tags) return false
    return this.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  }

  hasAnyTag(searchTags: string[]): boolean {
    if (!this.tags) return false
    return searchTags.some(searchTag => this.hasTag(searchTag))
  }

  // Metadata operations
  hasMetadata(key: string): boolean {
    if (!this.metadata) return false
    return this.metadata.hasOwnProperty(key)
  }

  getMetadataValue(key: string): string | undefined {
    if (!this.metadata) return undefined
    return this.metadata[key]
  }

  // File path utilities
  getFileName(): string {
    const parts = this.filePath.split(/[/\\]/)
    return parts[parts.length - 1] || ''
  }

  getFileExtension(): string {
    const fileName = this.getFileName()
    const lastDotIndex = fileName.lastIndexOf('.')
    
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1 || lastDotIndex === 0) {
      return ''
    }
    
    return fileName.substring(lastDotIndex + 1)
  }

  // Update methods that return new instances
  updateName(newName: string): DocumentEntity {
    const updatedData: DocumentType = {
      ...this,
      name: newName,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new DocumentEntity(updatedData)
  }

  updateFileInfo(newFilePath: string, newMimeType: string, newSize: number): DocumentEntity {
    const updatedData: DocumentType = {
      ...this,
      filePath: newFilePath,
      mimeType: newMimeType,
      size: newSize,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new DocumentEntity(updatedData)
  }

  updateTags(newTags: string[]): DocumentEntity {
    const updatedData: DocumentType = {
      ...this,
      tags: newTags.length > 0 ? newTags : undefined,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new DocumentEntity(updatedData)
  }

  addTags(tagsToAdd: string[]): DocumentEntity {
    const currentTags = this.tags || []
    const newTags = [...currentTags, ...tagsToAdd]
    return this.updateTags(newTags)
  }

  removeTags(tagsToRemove: string[]): DocumentEntity {
    if (!this.tags) return this
    
    const newTags = this.tags.filter(tag => 
      !tagsToRemove.some(removeTag => tag.toLowerCase() === removeTag.toLowerCase())
    )
    return this.updateTags(newTags)
  }

  updateMetadata(newMetadata: Record<string, string>): DocumentEntity {
    const currentMetadata = this.metadata || {}
    const updatedMetadata = { ...currentMetadata, ...newMetadata }
    
    const updatedData: DocumentType = {
      ...this,
      metadata: Object.keys(updatedMetadata).length > 0 ? updatedMetadata : undefined,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new DocumentEntity(updatedData)
  }

  // Utility methods
  isRecentlyUpdated(hours: number = 24): boolean {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)
    return (this.updatedAt as any) > cutoffTime // Type assertion for now
  }

  serialize() {
    return bridge.serialize(this)
  }

  // Convert to repository format
  toRepository(): {
    id: string
    name: string
    filePath: string
    mimeType: string
    size: number
    tags: string[]
    metadata: Record<string, string>
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      name: this.name,
      filePath: this.filePath,
      mimeType: this.mimeType,
      size: this.size,
      tags: [...(this.tags || [])],
      metadata: this.metadata || {},
      createdAt: this.createdAt as any, // Type assertion for now
      updatedAt: this.updatedAt as any, // Type assertion for now
    }
  }
}
