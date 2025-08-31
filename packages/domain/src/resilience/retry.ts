import { Result } from "@carbonteq/fp"

export interface RetryOptions {
  readonly maxAttempts?: number
  readonly baseDelay?: number
  readonly maxDelay?: number
  readonly factor?: number
}

export class Retry {
  constructor(
    private readonly options: RetryOptions = {}
  ) {
    this.options = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      factor: 2,
      ...options
    }
  }

  async retry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let attempts = 0
    const maxAttempts = this.options.maxAttempts!

    while (attempts < maxAttempts) {
      try {
        attempts++
        return await operation()
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw error
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.options.baseDelay! * Math.pow(this.options.factor!, attempts - 1),
          this.options.maxDelay!
        )
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error("Max retry attempts exceeded")
  }

  async retryWithResult<T, E extends Error>(
    operation: () => Promise<Result<T, E>>
  ): Promise<Result<T, E>> {
    let attempts = 0
    const maxAttempts = this.options.maxAttempts!

    while (attempts < maxAttempts) {
      attempts++
      const result = await operation()
      
      if (result.isOk()) {
        return result
      }
      
      // If this is the last attempt, return the error
      if (attempts >= maxAttempts) {
        return result
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        this.options.baseDelay! * Math.pow(this.options.factor!, attempts - 1),
        this.options.maxDelay!
      )
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // This should never be reached, but TypeScript requires it
    throw new Error("Max retry attempts exceeded")
  }
}
