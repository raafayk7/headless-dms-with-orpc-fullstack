import { Result } from "@carbonteq/fp"
import { AppError, InternalError } from "@domain/utils/base.errors"

export enum CircuitBreakerState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half-open"
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitBreakerState
  ) {
    super(message)
    this.name = "CircuitBreakerError"
  }

  static openCircuit(): CircuitBreakerError {
    return new CircuitBreakerError(
      "Circuit breaker is open - service unavailable",
      CircuitBreakerState.OPEN
    )
  }

  static halfOpenLimitReached(): CircuitBreakerError {
    return new CircuitBreakerError(
      "Half-open circuit breaker limit reached",
      CircuitBreakerState.HALF_OPEN
    )
  }
}

export interface CircuitBreakerOptions {
  readonly failureThreshold?: number
  readonly timeoutMs?: number
  readonly halfOpenMaxCalls?: number
  readonly successThreshold?: number
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount: number = 0
  private lastFailureTime?: Date
  private halfOpenCallCount: number = 0
  private consecutiveSuccessCount: number = 0

  constructor(
    private readonly options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: 5,
      timeoutMs: 30000,
      halfOpenMaxCalls: 3,
      successThreshold: 3,
      ...options
    }
  }

  async execute<T>(
    operation: () => Promise<T>
  ): Promise<Result<T, CircuitBreakerError | AppError>> {
    const stateCheck = this.checkState()
    if (stateCheck.isErr()) {
      return stateCheck
    }

    try {
      const result = await operation()
      this.recordSuccess()
      this.attemptCloseCircuit()
      return Result.Ok(result)
    } catch (error) {
      this.recordFailure()
      this.attemptOpenCircuit()
      
      if (error instanceof AppError) {
        return Result.Err(error)
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      return Result.Err(new InternalError(errorMessage, error instanceof Error ? error : undefined))
    }
  }

  private checkState(): Result<void, CircuitBreakerError> {
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return Result.Ok(undefined)
        
      case CircuitBreakerState.OPEN:
        if (this.shouldAttemptHalfOpen()) {
          this.transitionToHalfOpen()
          return Result.Ok(undefined)
        }
        return Result.Err(CircuitBreakerError.openCircuit())
        
      case CircuitBreakerState.HALF_OPEN:
        if (this.halfOpenCallCount >= this.options.halfOpenMaxCalls!) {
          return Result.Err(CircuitBreakerError.halfOpenLimitReached())
        }
        this.halfOpenCallCount++
        return Result.Ok(undefined)
        
      default:
        return Result.Err(CircuitBreakerError.openCircuit())
    }
  }

  private shouldAttemptHalfOpen(): boolean {
    if (!this.lastFailureTime) return true
    const elapsed = Date.now() - this.lastFailureTime.getTime()
    return elapsed >= this.options.timeoutMs!
  }

  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN
    this.halfOpenCallCount = 0
  }

  private recordSuccess(): void {
    this.consecutiveSuccessCount++
    this.halfOpenCallCount = 0
  }

  private recordFailure(): void {
    this.failureCount++
    this.consecutiveSuccessCount = 0
    this.lastFailureTime = new Date()
  }

  private attemptOpenCircuit(): void {
    if (this.state === CircuitBreakerState.CLOSED &&
        this.failureCount >= this.options.failureThreshold!) {
      this.state = CircuitBreakerState.OPEN
    }
  }

  private attemptCloseCircuit(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN &&
        this.consecutiveSuccessCount >= this.options.successThreshold!) {
      this.state = CircuitBreakerState.CLOSED
      this.failureCount = 0
      this.consecutiveSuccessCount = 0
      this.halfOpenCallCount = 0
    }
  }

  getState(): CircuitBreakerState {
    // Check if we should transition from OPEN to HALF_OPEN based on timeout
    if (this.state === CircuitBreakerState.OPEN && this.shouldAttemptHalfOpen()) {
      this.transitionToHalfOpen()
    }
    return this.state
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.consecutiveSuccessCount = 0
    this.halfOpenCallCount = 0
    this.lastFailureTime = undefined
  }
}
