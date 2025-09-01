import { promises as fs, existsSync } from "fs"
import { join, dirname, basename, extname } from "path"
import { injectable } from "tsyringe"
import { Result } from "@carbonteq/fp"
import { StorageError } from "../storage.strategy"
import type { IStorageStrategy, FileInfo } from "../storage.strategy"
@injectable()
export class LocalStorageStrategy implements IStorageStrategy {
  constructor(private readonly basePath: string = "./uploads") {
    this.ensureBaseDirectory()
  }

  async upload(file: Buffer, name: string, mimeType: string): Promise<Result<string, StorageError>> {
    try {
      const filePath = this.buildFilePath(name)
      const fullPath = join(this.basePath, filePath)

      await this.ensureDirectory(dirname(fullPath))
      await fs.writeFile(fullPath, file)

      return Result.Ok(filePath)
    } catch (error) {
      return Result.Err(StorageError.uploadFailed(name, error instanceof Error ? error : undefined))
    }
  }

  async download(filePath: string): Promise<Result<Buffer, StorageError>> {
    try {
      const fullPath = join(this.basePath, filePath)

      if (!existsSync(fullPath)) {
        return Result.Err(StorageError.fileNotFound(filePath))
      }

      const content = await fs.readFile(fullPath)
      return Result.Ok(content)
    } catch (error) {
      return Result.Err(StorageError.downloadFailed(filePath, error instanceof Error ? error : undefined))
    }
  }

  async delete(filePath: string): Promise<Result<boolean, StorageError>> {
    try {
      const fullPath = join(this.basePath, filePath)

      if (!existsSync(fullPath)) {
        return Result.Ok(false)
      }

      await fs.unlink(fullPath)
      return Result.Ok(true)
    } catch (error) {
      return Result.Err(StorageError.deleteFailed(filePath, error instanceof Error ? error : undefined))
    }
  }

  async exists(filePath: string): Promise<Result<boolean, StorageError>> {
    try {
      const fullPath = join(this.basePath, filePath)
      return Result.Ok(existsSync(fullPath))
    } catch (error) {
      return Result.Err(new StorageError(`Failed to check file existence: ${filePath}`, { filePath }, error))
    }
  }

  async getFileInfo(filePath: string): Promise<Result<FileInfo, StorageError>> {
    try {
      const fullPath = join(this.basePath, filePath)

      if (!existsSync(fullPath)) {
        return Result.Err(StorageError.fileNotFound(filePath))
      }

      const stats = await fs.stat(fullPath)
      const fileInfo: FileInfo = {
        name: basename(filePath),
        path: filePath,
        mimeType: this.getMimeTypeFromExtension(extname(filePath)),
        size: stats.size,
        createdAt: stats.birthtime,
      }

      return Result.Ok(fileInfo)
    } catch (error) {
      return Result.Err(new StorageError(`Failed to get file info: ${filePath}`, { filePath }, error))
    }
  }

  private buildFilePath(fileName: string): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const extension = extname(fileName)
    const baseName = basename(fileName, extension)
    
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    
    return `${year}/${month}/${day}/${baseName}_${timestamp}_${randomId}${extension}`
  }

  private async ensureBaseDirectory(): Promise<void> {
    try {
      if (!existsSync(this.basePath)) {
        await fs.mkdir(this.basePath, { recursive: true })
      }
    } catch (error) {
      console.error(`Failed to create base directory: ${this.basePath}`, error)
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      ".txt": "text/plain",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg",
      ".zip": "application/zip",
    }
    
    return mimeTypes[extension.toLowerCase()] || "application/octet-stream"
  }
}
