import { Result } from "@carbonteq/fp"
import { AppError } from "@domain/utils/base.errors"

export class StorageError extends AppError {
  readonly code: string = "STORAGE_ERROR"

  constructor(
    message: string,
    context?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super(message, context, cause)
  }

  static fileNotFound(filePath: string): StorageError {
    return new StorageError(`File not found: ${filePath}`, { filePath })
  }

  static uploadFailed(fileName: string, cause?: unknown): StorageError {
    return new StorageError(`Failed to upload file: ${fileName}`, { fileName }, cause)
  }

  static downloadFailed(filePath: string, cause?: unknown): StorageError {
    return new StorageError(`Failed to download file: ${filePath}`, { filePath }, cause)
  }

  static deleteFailed(filePath: string, cause?: unknown): StorageError {
    return new StorageError(`Failed to delete file: ${filePath}`, { filePath }, cause)
  }
}

export interface FileInfo {
  name: string
  path: string
  mimeType: string
  size: number
  createdAt: Date
}

export interface IStorageStrategy {
  upload(file: Buffer, name: string, mimeType: string): Promise<Result<string, StorageError>>
  download(filePath: string): Promise<Result<Buffer, StorageError>>
  delete(filePath: string): Promise<Result<boolean, StorageError>>
  exists(filePath: string): Promise<Result<boolean, StorageError>>
  getFileInfo(filePath: string): Promise<Result<FileInfo, StorageError>>
}
