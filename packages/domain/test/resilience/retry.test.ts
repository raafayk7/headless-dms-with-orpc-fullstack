import { describe, expect, it } from "bun:test"
import { Result } from "@carbonteq/fp"
import { Retry } from "../../src/resilience/retry"

describe("Retry", () => {
  it("should execute operation successfully on first try", async () => {
    const retry = new Retry()
    let attempts = 0
    
    const operation = async () => {
      attempts++
      return "success"
    }
    
    const result = await retry.retry(operation)
    expect(result).toBe("success")
    expect(attempts).toBe(1)
  })

  it("should retry failed operations", async () => {
    const retry = new Retry({ maxAttempts: 3 })
    let attempts = 0
    
    const operation = async () => {
      attempts++
      if (attempts < 3) {
        throw new Error("fail")
      }
      return "success"
    }
    
    const result = await retry.retry(operation)
    expect(result).toBe("success")
    expect(attempts).toBe(3)
  })

  it("should throw error after max attempts", async () => {
    const retry = new Retry({ maxAttempts: 2 })
    let attempts = 0
    
    const operation = async () => {
      attempts++
      throw new Error("always fail")
    }
    
    try {
      await retry.retry(operation)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe("always fail")
      expect(attempts).toBe(2)
    }
  })

  it("should work with Result types", async () => {
    const retry = new Retry({ maxAttempts: 3 })
    let attempts = 0
    
    const operation = async (): Promise<Result<string, Error>> => {
      attempts++
      if (attempts < 3) {
        return Result.Err(new Error("fail"))
      }
      return Result.Ok("success")
    }
    
    const result = await retry.retryWithResult(operation)
    expect(result.isOk()).toBe(true)
    expect(result.unwrap()).toBe("success")
    expect(attempts).toBe(3)
  })

  it("should return error Result after max attempts", async () => {
    const retry = new Retry({ maxAttempts: 2 })
    let attempts = 0
    
    const operation = async (): Promise<Result<string, Error>> => {
      attempts++
      return Result.Err(new Error("always fail"))
    }
    
    const result = await retry.retryWithResult(operation)
    expect(result.isErr()).toBe(true)
    expect(result.unwrapErr().message).toBe("always fail")
    expect(attempts).toBe(2)
  })

  it("should use custom options", async () => {
    const retry = new Retry({ 
      maxAttempts: 5, 
      baseDelay: 50, 
      factor: 1.5 
    })
    
    expect(retry).toBeInstanceOf(Retry)
  })
})
