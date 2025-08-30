import { Result as R, type Result } from "@carbonteq/fp"
import type { DocumentEntity, DocumentType, DocumentUpdateType } from "@domain/document/document.entity"
import { DocumentEntity as Document } from "@domain/document/document.entity"
import { DocumentNotFoundError, DocumentAlreadyExistsError, DocumentValidationError } from "@domain/document/document.errors"
import { DocumentRepository, type DocumentFilterQuery } from "@domain/document/document.repository"
import { FpUtils, type RepoResult, type RepoUnitResult } from "@domain/utils"

import { and, eq, sql, gte, lte, asc, desc, ilike, arrayOverlaps, or } from "drizzle-orm"
import { injectable } from "tsyringe"
import type { AppDatabase } from "../conn"
import { InjectDb } from "../conn"
import { documents } from "../schema"
import { enhanceEntityMapper } from "./repo.utils"

const mapper = enhanceEntityMapper((row: typeof documents.$inferSelect) =>
  Document.fromEncoded({
    id: row.id as DocumentType["id"],
    name: row.name,
    filePath: row.filePath,
    mimeType: row.mimeType,
    size: row.size,
    tags: row.tags || [],
    metadata: row.metadata || { "" : "" },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
)

@injectable()
export class DrizzleDocumentRepository extends DocumentRepository {
  constructor(@InjectDb() private readonly db: AppDatabase) {
    super()
  }

  async create(document: DocumentEntity): Promise<Result<DocumentEntity, DocumentAlreadyExistsError>> {
    try {
      // Check if document already exists
      const existing = await this.db.query.documents.findFirst({
        where: eq(documents.name, document.name),
      })

      if (existing) {
        return R.Err(new DocumentAlreadyExistsError(document.name))
      }

      const encoded = FpUtils.serialized(document)
      const res = await encoded
        .map(async (docData) => {
            const { id, ...docDataWithoutId } = docData
            const [newDoc] = await this.db.insert(documents).values({
              ...docDataWithoutId,
              tags: docData.tags ? [...docData.tags] : [], // Convert readonly to mutable
              metadata: docData.metadata ? { ...docData.metadata } : {}, // Convert readonly to mutable
            }).returning()

          return document
        })
        .mapErr(() => new DocumentAlreadyExistsError(document.name)) // Transform ValidationError to DocumentAlreadyExistsError
        .toPromise()

      return res
    } catch (error) {
      return R.Err(new DocumentAlreadyExistsError(document.name))
    }
  }

  async update(document: DocumentEntity): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>> {
    try {
      const encoded = FpUtils.serialized(document)
      const res = await encoded
      .flatMap(async (docData) => {
        const { id, ...docDataWithoutId } = docData
        const [updatedDoc] = await this.db.update(documents)
          .set({
            ...docDataWithoutId,
            tags: docData.tags ? [...docData.tags] : [],
            metadata: docData.metadata ? { ...docData.metadata } : {},
            updatedAt: new Date(),
          })
          .where(eq(documents.id, document.id))
          .returning()

        if (!updatedDoc) {
          return R.Err(new DocumentNotFoundError(document.id))
        }

        return R.Ok(document)
      })
      .mapErr(() => new DocumentNotFoundError(document.id)) // Transform ValidationError to DocumentNotFoundError
      .toPromise()

      return res
    } catch (error) {
      return R.Err(new DocumentNotFoundError(document.id))
    }
  }

  async delete(id: DocumentType["id"]): Promise<Result<void, DocumentNotFoundError>> {
    try {
        const deletedDocs = await this.db.delete(documents).where(eq(documents.id, id)).returning()
      
      if (deletedDocs.length === 0) {
        return R.Err(new DocumentNotFoundError(id))
      }
// ... exis

      return R.Ok(undefined)
    } catch (error) {
      return R.Err(new DocumentNotFoundError(id))
    }
  }

  async findById(id: DocumentType["id"]): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>> {
    try {
      const row = await this.db.query.documents.findFirst({
        where: eq(documents.id, id),
      })

      if (!row) {
        return R.Err(new DocumentNotFoundError(id))
      }

      return mapper.mapOne(row)
    } catch (error) {
      return R.Err(new DocumentNotFoundError(id))
    }
  }

  async findByName(name: string): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>> {
    try {
      const row = await this.db.query.documents.findFirst({
        where: eq(documents.name, name),
      })

      if (!row) {
        return R.Err(new DocumentValidationError("Document not found"))
      }

      return mapper.mapOne(row)
    } catch (error) {
      return R.Err(new DocumentValidationError("Document not found"))
    }
  }

  async find(query?: DocumentFilterQuery, pagination?: { page?: number; limit?: number }): Promise<Result<DocumentEntity[], Error>> {
    try {
      const conditions = this.buildQueryConditions(query)
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const countResult = await this.db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(whereClause)
        .execute()
      const total = countResult[0]?.count || 0

      // Apply pagination
      const page = pagination?.page || 1
      const limit = pagination?.limit || 10
      const offset = (page - 1) * limit

      // Get paginated results
      const results = await this.db.select()
        .from(documents)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(documents.createdAt))
        .execute()

      // Transform results to Document entities
      const docResults = mapper.mapMany(results)
      
      if (docResults.isErr()) {
        return R.Err(new Error(`Failed to transform document records: ${docResults.unwrapErr().message}`))
      }

      return R.Ok(docResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find documents: ${error}`))
    }
  }

  async findByTags(tags: string[]): Promise<Result<DocumentEntity[], Error>> {
    try {
      const results = await this.db.select()
        .from(documents)
        .where(arrayOverlaps(documents.tags, tags))
        .execute()

      const docResults = mapper.mapMany(results)
      
      if (docResults.isErr()) {
        return R.Err(new Error(`Failed to transform document records: ${docResults.unwrapErr().message}`))
      }

      return R.Ok(docResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find documents by tags: ${error}`))
    }
  }

  async findByMimeType(mimeType: string): Promise<Result<DocumentEntity[], Error>> {
    try {
      const results = await this.db.select()
        .from(documents)
        .where(eq(documents.mimeType, mimeType))
        .execute()

      const docResults = mapper.mapMany(results)
      
      if (docResults.isErr()) {
        return R.Err(new Error(`Failed to transform document records: ${docResults.unwrapErr().message}`))
      }

      return R.Ok(docResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find documents by MIME type: ${error}`))
    }
  }

  async findByDateRange(fromDate: Date, toDate: Date): Promise<Result<DocumentEntity[], Error>> {
    try {
      const results = await this.db.select()
        .from(documents)
        .where(
          and(
            gte(documents.createdAt, fromDate),
            lte(documents.createdAt, toDate)
          )
        )
        .execute()

      const docResults = mapper.mapMany(results)
      
      if (docResults.isErr()) {
        return R.Err(new Error(`Failed to transform document records: ${docResults.unwrapErr().message}`))
      }

      return R.Ok(docResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find documents by date range: ${error}`))
    }
  }

  async findBySizeRange(minSize: number, maxSize: number): Promise<Result<DocumentEntity[], Error>> {
    try {
      const results = await this.db.select()
        .from(documents)
        .where(
          and(
            gte(documents.size, minSize),
            lte(documents.size, maxSize)
          )
        )
        .execute()

      const docResults = mapper.mapMany(results)
      
      if (docResults.isErr()) {
        return R.Err(new Error(`Failed to transform document records: ${docResults.unwrapErr().message}`))
      }

      return R.Ok(docResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find documents by size range: ${error}`))
    }
  }

  async exists(query: DocumentFilterQuery): Promise<Result<boolean, Error>> {
    try {
      const conditions = this.buildQueryConditions(query)
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const result = await this.db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(whereClause)
        .execute()

      return R.Ok((result[0]?.count || 0) > 0)
    } catch (error) {
      return R.Err(new Error(`Failed to check document existence: ${error}`))
    }
  }

  async count(query?: DocumentFilterQuery): Promise<Result<number, Error>> {
    try {
      const conditions = this.buildQueryConditions(query)
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const result = await this.db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(whereClause)
        .execute()

      return R.Ok(result[0]?.count || 0)
    } catch (error) {
      return R.Err(new Error(`Failed to count documents: ${error}`))
    }
  }

  async updateDocumentFields(
    id: DocumentType["id"], 
    updates: DocumentUpdateType
  ): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>> {
    try {
      const [updatedDoc] = await this.db.update(documents)
        .set({
          ...updates,
          tags: updates.tags ? [...updates.tags] : [],
          metadata: updates.metadata ? { ...updates.metadata } : {},
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning()

      if (!updatedDoc) {
        return R.Err(new DocumentNotFoundError(id))
      }

      return mapper.mapOne(updatedDoc)
    } catch (error) {
      return R.Err(new DocumentNotFoundError(id))
    }
  }

  async findByFilePath(filePath: string): Promise<RepoResult<DocumentEntity, DocumentNotFoundError>> {
    try {
      const row = await this.db.query.documents.findFirst({
        where: eq(documents.filePath, filePath),
      })

      if (!row) {
        return R.Err(new DocumentValidationError("Document not found"))
      }

      return mapper.mapOne(row)
    } catch (error) {
      return R.Err(new DocumentValidationError("Document not found"))
    }
  }

  async findDocumentsByUser(userId: string): Promise<Result<DocumentEntity[], Error>> {
    try {
      // TODO: Add userId field to documents schema
      // For now, return empty array
      return R.Ok([])
    } catch (error) {
      return R.Err(new Error(`Failed to find documents by user: ${error}`))
    }
  }

  async searchDocuments(searchTerm: string): Promise<Result<DocumentEntity[], Error>> {
    try {
      const results = await this.db.select()
        .from(documents)
        .where(
          or(
            ilike(documents.name, `%${searchTerm}%`),
            arrayOverlaps(documents.tags, [searchTerm])
          )
        )
        .execute()

      const docResults = mapper.mapMany(results)
      
      if (docResults.isErr()) {
        return R.Err(new Error(`Failed to transform document records: ${docResults.unwrapErr().message}`))
      }

      return R.Ok(docResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to search documents: ${error}`))
    }
  }

  async findRecentDocuments(hours: number): Promise<Result<DocumentEntity[], Error>> {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hours)

      const results = await this.db.select()
        .from(documents)
        .where(gte(documents.updatedAt, cutoffTime))
        .orderBy(desc(documents.updatedAt))
        .execute()

      const docResults = mapper.mapMany(results)
      
      if (docResults.isErr()) {
        return R.Err(new Error(`Failed to transform document records: ${docResults.unwrapErr().message}`))
      }

      return R.Ok(docResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find recent documents: ${error}`))
    }
  }

  private buildQueryConditions(query?: DocumentFilterQuery) {
    const conditions = []
    
    if (query?.name) {
      conditions.push(ilike(documents.name, `%${query.name}%`))
    }
    
    if (query?.mimeType) {
      conditions.push(eq(documents.mimeType, query.mimeType))
    }
    
    if (query?.tags && query.tags.length > 0) {
      conditions.push(arrayOverlaps(documents.tags, query.tags))
    }
    
    if (query?.fromDate) {
      conditions.push(gte(documents.createdAt, query.fromDate))
    }
    
    if (query?.toDate) {
      conditions.push(lte(documents.createdAt, query.toDate))
    }
    
    if (query?.minSize !== undefined) {
      conditions.push(gte(documents.size, query.minSize))
    }
    
    if (query?.maxSize !== undefined) {
      conditions.push(lte(documents.size, query.maxSize))
    }
    
    return conditions
  }
}
