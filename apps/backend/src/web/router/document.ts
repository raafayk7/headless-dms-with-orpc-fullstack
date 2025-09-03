import { DocumentWorkflows } from "@application/workflows"
import { container } from "tsyringe"
import { authenticated } from "../utils/orpc"
import { handleAppResult } from "../utils/result-handler"
import { requireAdmin } from "../utils/rbac"
import { getFileStreamingOptions, getContentDisposition, getCacheHeaders } from "../utils/file-streaming.utils"

const base = authenticated.document

// Get documents with filtering and pagination (authenticated)
const getDocumentsHandler = base.getDocuments.handler(async ({ input }) => {
  const documentWorkflows = container.resolve(DocumentWorkflows)
  // Transform query to match expected DTO format
  let metadata: Record<string, string> | undefined = undefined
  
  // Handle metadata in different formats
  if (input.metadata) {
    try {
      metadata = JSON.parse(input.metadata)
    } catch {
      // If not valid JSON, treat as key=value format
      const keyValuePairs = input.metadata.split(',')
      metadata = {}
      keyValuePairs.forEach(pair => {
        const [key, value] = pair.split('=')
        if (key && value) {
          metadata![key.trim()] = value.trim()
        }
      })
    }
  } else if (input.metadataKey && input.metadataValue) {
    // Handle individual key-value pair
    metadata = { [input.metadataKey]: input.metadataValue }
  }
  
  const filters = {
    name: input.name,
    mimeType: input.mimeType,
    tags: input.tags ? input.tags.split(',').map(t => t.trim()) : undefined,
    metadata,
  }
  
  const result = await documentWorkflows.getDocuments(
    { data: filters },
    { data: { page: input.page || 1, limit: input.limit || 10 } }
  )
  
  if (result.isErr()) {
    return handleAppResult(result)
  }
  
  const { documents, total } = result.unwrap()
  const serializedDocuments = documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    mimeType: doc.mimeType,
    filePath: doc.filePath,
    size: doc.size,
    tags: doc.tags,
    metadata: doc.metadata,
    createdAt: new Date(doc.createdAt.epochMillis).toISOString(),
    updatedAt: new Date(doc.updatedAt.epochMillis).toISOString(),
  }))
  
  return {
    documents: serializedDocuments,
    pagination: {
      page: input.page || 1,
      limit: input.limit || 10,
      total,
      totalPages: Math.ceil(total / (input.limit || 10)),
    }
  }
})

// Get document by ID (authenticated)
const getDocumentByIdHandler = base.getDocumentById.handler(async ({ input }) => {
  const documentWorkflows = container.resolve(DocumentWorkflows)
  const result = await documentWorkflows.getDocumentById(input.params.id)
  
  if (result.isErr()) {
    return handleAppResult(result)
  }
  
  const document = result.unwrap()
  return {
    id: document.id,
    name: document.name,
    mimeType: document.mimeType,
    filePath: document.filePath,
    size: document.size,
    tags: document.tags,
    metadata: document.metadata,
    createdAt: new Date(document.createdAt.epochMillis).toISOString(),
    updatedAt: new Date(document.updatedAt.epochMillis).toISOString(),
  }
})

// Upload document (admin only)
const uploadDocumentHandler = base.uploadDocument.handler(requireAdmin(async ({ input, context }) => {
  const documentWorkflows = container.resolve(DocumentWorkflows)
  const result = await documentWorkflows.uploadDocument(context.user, input)
  
  if (result.isErr()) {
    return handleAppResult(result)
  }
  
  const document = result.unwrap()
  return {
    id: document.id,
    name: document.name,
    mimeType: document.mimeType,
    filePath: document.filePath,
    size: document.size,
    tags: document.tags,
    metadata: document.metadata,
    createdAt: new Date(document.createdAt.epochMillis).toISOString(),
    updatedAt: new Date(document.updatedAt.epochMillis).toISOString(),
  }
}))

// Update document (admin only)
const updateDocumentHandler = base.updateDocument.handler(requireAdmin(async ({ input, context }) => {
  const documentWorkflows = container.resolve(DocumentWorkflows)
  const result = await documentWorkflows.patchDocument(context.user, input.params.id, { data: input.body })
  
  if (result.isErr()) {
    return handleAppResult(result)
  }
  
  const document = result.unwrap()
  return {
    id: document.id,
    name: document.name,
    mimeType: document.mimeType,
    filePath: document.filePath,
    size: document.size,
    tags: document.tags,
    metadata: document.metadata,
    createdAt: new Date(document.createdAt.epochMillis).toISOString(),
    updatedAt: new Date(document.updatedAt.epochMillis).toISOString(),
  }
}))

// Generate download link (authenticated)
const generateDownloadLinkHandler = base.generateDownloadLink.handler(async ({ input }) => {
  const documentWorkflows = container.resolve(DocumentWorkflows)
  const result = await documentWorkflows.generateDownloadToken(input.params.id, 5) // 5 minutes expiry
  
  if (result.isErr()) {
    return handleAppResult(result)
  }
  
  const token = result.unwrap()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
  
  return {
    downloadUrl: `/api/files/download?token=${token}`,
    expiresAt: expiresAt.toISOString(),
  }
})



// Delete document (admin only)
const deleteDocumentHandler = base.deleteDocument.handler(requireAdmin(async ({ input, context }) => {
  const documentWorkflows = container.resolve(DocumentWorkflows)
  const result = await documentWorkflows.deleteDocument(context.user, input.params.id)
  
  return handleAppResult(result)
}))

export default base.router({
  getDocuments: getDocumentsHandler,
  getDocumentById: getDocumentByIdHandler,
  uploadDocument: uploadDocumentHandler,
  updateDocument: updateDocumentHandler,
  generateDownloadLink: generateDownloadLinkHandler,
  deleteDocument: deleteDocumentHandler,
})
