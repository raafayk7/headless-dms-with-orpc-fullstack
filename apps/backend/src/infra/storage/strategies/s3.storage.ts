import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { injectable } from "tsyringe"
import { Result } from "@carbonteq/fp"
import { StorageError } from "../storage.strategy"
import type { IStorageStrategy, FileInfo } from "../storage.strategy"
import storageConfig from "../storage.config"

@injectable()
export class S3StorageStrategy implements IStorageStrategy {
  private readonly s3Client: S3Client
  private readonly bucketName: string

  constructor() {
    const { s3 } = storageConfig
    
    if (!s3.bucketName || !s3.accessKeyId || !s3.secretAccessKey) {
      throw new Error("S3 configuration is incomplete. Please set S3_BUCKET_NAME, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY")
    }

    this.bucketName = s3.bucketName

    this.s3Client = new S3Client({
      region: s3.region,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      ...(s3.endpoint && {
        endpoint: s3.endpoint,
        forcePathStyle: true, // Required for LocalStack
      }),
    })
  }

  async upload(file: Buffer, name: string, mimeType: string): Promise<Result<string, StorageError>> {
    try {
      const filePath = this.buildFilePath(name)

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: file,
        ContentType: mimeType,
        ContentLength: file.length,
      })

      await this.s3Client.send(command)
      return Result.Ok(filePath)
    } catch (error) {
      return Result.Err(StorageError.uploadFailed(name, error instanceof Error ? error : undefined))
    }
  }

  async download(filePath: string): Promise<Result<Buffer, StorageError>> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      })

      const response = await this.s3Client.send(command)
      
      if (!response.Body) {
        return Result.Err(StorageError.fileNotFound(filePath))
      }

      const chunks: Uint8Array[] = []
      const stream = response.Body as any

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const buffer = Buffer.concat(chunks)
      return Result.Ok(buffer)
    } catch (error) {
      return Result.Err(StorageError.downloadFailed(filePath, error instanceof Error ? error : undefined))
    }
  }

  async delete(filePath: string): Promise<Result<boolean, StorageError>> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      })

      await this.s3Client.send(command)
      return Result.Ok(true)
    } catch (error) {
      return Result.Err(StorageError.deleteFailed(filePath, error instanceof Error ? error : undefined))
    }
  }

  async exists(filePath: string): Promise<Result<boolean, StorageError>> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      })

      await this.s3Client.send(command)
      return Result.Ok(true)
    } catch (error) {
      // S3 throws an error if the object doesn't exist
      return Result.Ok(false)
    }
  }

  async getFileInfo(filePath: string): Promise<Result<FileInfo, StorageError>> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      })

      const response = await this.s3Client.send(command)

      if (!response.LastModified) {
        return Result.Err(StorageError.fileNotFound(filePath))
      }

      const fileInfo: FileInfo = {
        name: this.getFileNameFromPath(filePath),
        path: filePath,
        mimeType: response.ContentType || "application/octet-stream",
        size: response.ContentLength || 0,
        createdAt: response.LastModified,
      }

      return Result.Ok(fileInfo)
    } catch (error) {
      return Result.Err(new StorageError(`Failed to get file info: ${filePath}`, { filePath }, error))
    }
  }

  private buildFilePath(fileName: string): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const extension = this.getFileExtension(fileName)
    const baseName = this.getFileNameWithoutExtension(fileName)
    
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    
    return `${year}/${month}/${day}/${baseName}_${timestamp}_${randomId}${extension}`
  }

  private getFileNameFromPath(filePath: string): string {
    const parts = filePath.split("/")
    return parts[parts.length - 1] || ""
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf(".")
    
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1 || lastDotIndex === 0) {
      return ""
    }
    
    return fileName.substring(lastDotIndex)
  }

  private getFileNameWithoutExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf(".")
    
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return fileName
    }
    
    return fileName.substring(0, lastDotIndex)
  }
}
