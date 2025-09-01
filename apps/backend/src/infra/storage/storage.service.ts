import { inject, injectable } from "tsyringe"
import { Result } from "@carbonteq/fp"
import { CircuitBreaker, Retry } from "@domain/resilience"
import { StorageError } from "./storage.strategy"
import type { IStorageStrategy, FileInfo } from "./storage.strategy"
import { LocalStorageStrategy } from "./strategies/local.storage"
import { S3StorageStrategy } from "./strategies/s3.storage"
import storageConfig from "./storage.config"

@injectable()
export class StorageService {
  private readonly strategy: IStorageStrategy
  private readonly circuitBreaker: CircuitBreaker
  private readonly retry: Retry

  constructor() {
    this.strategy = this.createStrategy()
    this.circuitBreaker = new CircuitBreaker()
    this.retry = new Retry()
  }

  async upload(file: Buffer, name: string, mimeType: string): Promise<Result<string, StorageError>> {
    return await this.retry.retryWithResult(async () => {
      return await this.strategy.upload(file, name, mimeType)
    })
  }

  async download(filePath: string): Promise<Result<Buffer, StorageError>> {
    return await this.retry.retryWithResult(async () => {
      return await this.strategy.download(filePath)
    })
  }

  async delete(filePath: string): Promise<Result<boolean, StorageError>> {
    return await this.retry.retryWithResult(async () => {
      return await this.strategy.delete(filePath)
    })
  }

  async exists(filePath: string): Promise<Result<boolean, StorageError>> {
    return await this.retry.retryWithResult(async () => {
      return await this.strategy.exists(filePath)
    })
  }

  async getFileInfo(filePath: string): Promise<Result<FileInfo, StorageError>> {
    return await this.retry.retryWithResult(async () => {
      return await this.strategy.getFileInfo(filePath)
    })
  }

  private createStrategy(): IStorageStrategy {
    switch (storageConfig.backend) {
      case "s3":
        return new S3StorageStrategy()
      case "local":
      default:
        return new LocalStorageStrategy(storageConfig.path)
    }
  }
}
