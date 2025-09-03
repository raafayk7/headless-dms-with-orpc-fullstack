import { describe, expect, it } from "bun:test"
import { Result } from "@carbonteq/fp"
import { CircuitBreaker, CircuitBreakerState, CircuitBreakerError } from "../../src/resilience/circuit-breaker"

describe("CircuitBreaker", () => {
  it("should start in CLOSED state", () => {
    const cb = new CircuitBreaker()
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED)
  })

  it("should execute operations when CLOSED", async () => {
    const cb = new CircuitBreaker()
    const operation = async () => "success"
    
    const result = await cb.execute(operation)
    expect(result.isOk()).toBe(true)
    expect(result.unwrap()).toBe("success")
  })

  it("should open circuit after failure threshold", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2 })
    const operation = async () => { throw new Error("fail") }
    
    // First failure
    const result1 = await cb.execute(operation)
    expect(result1.isErr()).toBe(true)
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED)
    
    // Second failure - should open circuit
    const result2 = await cb.execute(operation)
    expect(result2.isErr()).toBe(true)
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN)
  })

  it("should reject operations when OPEN", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1 })
    const operation = async () => { throw new Error("fail") }
    
    // Fail once to open circuit
    await cb.execute(operation)
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN)
    
    // Try to execute again
    const result = await cb.execute(async () => "should not execute")
    expect(result.isErr()).toBe(true)
    expect(result.unwrapErr()).toBeInstanceOf(CircuitBreakerError)
    expect((result.unwrapErr() as CircuitBreakerError).state).toBe(CircuitBreakerState.OPEN)
  })

  it("should transition to HALF_OPEN after timeout", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, timeoutMs: 10 })
    const operation = async () => { throw new Error("fail") }
    
    // Fail once to open circuit
    await cb.execute(operation)
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN)
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // Should transition to HALF_OPEN
    expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN)
  })

  it("should close circuit after success threshold", async () => {
    const cb = new CircuitBreaker({ 
      failureThreshold: 1, 
      timeoutMs: 10, 
      successThreshold: 2 
    })
    
    // Fail once to open circuit
    await cb.execute(async () => { throw new Error("fail") })
    
    // Wait for timeout to transition to HALF_OPEN
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN)
    
    // First success
    const result1 = await cb.execute(async () => "success1")
    expect(result1.isOk()).toBe(true)
    expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN)
    
    // Second success - should close circuit
    const result2 = await cb.execute(async () => "success2")
    expect(result2.isOk()).toBe(true)
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED)
  })

  it("should reset to initial state", () => {
    const cb = new CircuitBreaker()
    cb.reset()
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED)
  })
})
