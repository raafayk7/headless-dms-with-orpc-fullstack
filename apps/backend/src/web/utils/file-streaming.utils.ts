/**
 * File streaming utilities for handling different document types
 */

export interface FileStreamingOptions {
  mimeType: string
  fileName: string
  fileSize: number
  fileBuffer: Buffer
}

/**
 * Get proper MIME type and streaming options for different file types
 */
export function getFileStreamingOptions(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): FileStreamingOptions {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  
  // Enhanced MIME type detection based on file extension and content
  const detectedMimeType = getEnhancedMimeType(extension, mimeType, fileBuffer)
  
  return {
    mimeType: detectedMimeType,
    fileName,
    fileSize: fileBuffer.length,
    fileBuffer,
  }
}

/**
 * Enhanced MIME type detection
 */
function getEnhancedMimeType(extension: string, originalMimeType: string, fileBuffer: Buffer): string {
  // If we have a valid original MIME type, use it
  if (originalMimeType && originalMimeType !== 'application/octet-stream') {
    return originalMimeType
  }
  
  // Enhanced MIME type mapping
  const mimeTypes: Record<string, string> = {
    // Text files
    'txt': 'text/plain; charset=utf-8',
    'csv': 'text/csv; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'xml': 'application/xml; charset=utf-8',
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'ts': 'application/typescript; charset=utf-8',
    'md': 'text/markdown; charset=utf-8',
    'rtf': 'application/rtf',
    
    // Word documents
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'dot': 'application/msword',
    'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
    
    // Excel documents
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
    'csv': 'text/csv',
    
    // PowerPoint documents
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    
    // PDF documents
    'pdf': 'application/pdf',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    
    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'bz2': 'application/x-bzip2',
    
    // Code files
    'py': 'text/x-python; charset=utf-8',
    'java': 'text/x-java-source; charset=utf-8',
    'cpp': 'text/x-c; charset=utf-8',
    'c': 'text/x-c; charset=utf-8',
    'h': 'text/x-c; charset=utf-8',
    'php': 'text/x-php; charset=utf-8',
    'rb': 'text/x-ruby; charset=utf-8',
    'go': 'text/x-go; charset=utf-8',
    'rs': 'text/x-rust; charset=utf-8',
    'swift': 'text/x-swift; charset=utf-8',
    'kt': 'text/x-kotlin; charset=utf-8',
    'scala': 'text/x-scala; charset=utf-8',
    'sh': 'text/x-shellscript; charset=utf-8',
    'bat': 'text/x-msdos-batch; charset=utf-8',
    'ps1': 'text/x-powershell; charset=utf-8',
    
    // Database files
    'sql': 'application/sql; charset=utf-8',
    'db': 'application/x-sqlite3',
    'sqlite': 'application/x-sqlite3',
    'sqlite3': 'application/x-sqlite3',
  }
  
  return mimeTypes[extension] || 'application/octet-stream'
}

/**
 * Get appropriate Content-Disposition header value
 */
export function getContentDisposition(fileName: string, mimeType: string): string {
  // For images, PDFs, and text files, allow inline viewing
  const inlineTypes = [
    'image/',
    'application/pdf',
    'text/',
    'application/json',
    'application/xml',
  ]
  
  const shouldInline = inlineTypes.some(type => mimeType.startsWith(type))
  
  if (shouldInline) {
    return `inline; filename="${fileName}"`
  }
  
  // For other files, force download
  return `attachment; filename="${fileName}"`
}

/**
 * Get appropriate cache headers based on file type
 */
export function getCacheHeaders(mimeType: string): Record<string, string> {
  // Static assets that can be cached
  const cacheableTypes = [
    'image/',
    'video/',
    'audio/',
    'application/pdf',
    'text/css',
    'application/javascript',
  ]
  
  const shouldCache = cacheableTypes.some(type => mimeType.startsWith(type))
  
  if (shouldCache) {
    return {
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'ETag': `"${Date.now()}"`,
    }
  }
  
  // Sensitive documents should not be cached
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}
