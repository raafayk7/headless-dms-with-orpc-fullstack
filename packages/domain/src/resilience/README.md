# Resilience Utilities

Simple and essential resilience patterns for the domain layer.

## Circuit Breaker

Prevents cascading failures by monitoring operation success/failure rates.

### Basic Usage

```typescript
import { CircuitBreaker } from "@domain/resilience"

const cb = new CircuitBreaker()

// Execute operation with circuit breaker protection
const result = await cb.execute(async () => {
  return await externalService.call()
})

if (result.isOk()) {
  console.log("Success:", result.unwrap())
} else {
  console.log("Failed:", result.unwrapErr())
}
```

### Custom Configuration

```typescript
const cb = new CircuitBreaker({
  failureThreshold: 3,      // Open circuit after 3 failures
  timeoutMs: 60000,         // Wait 1 minute before half-open
  halfOpenMaxCalls: 2,      // Allow 2 calls in half-open state
  successThreshold: 2        // Close circuit after 2 successes
})
```

### Circuit States

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit is open, requests fail fast
- **HALF_OPEN**: Testing if service has recovered

## Retry

Retry operations with exponential backoff using a lightweight custom implementation.

### Basic Usage

```typescript
import { Retry } from "@domain/resilience"

const retry = new Retry()

// Retry operation with default settings
const result = await retry.retry(async () => {
  return await externalService.call()
})
```

### With Result Types

```typescript
const retry = new Retry()

// For operations returning Result<T, E>
const result = await retry.retryWithResult(async () => {
  return await service.method()
})

if (result.isOk()) {
  console.log("Success:", result.unwrap())
} else {
  console.log("Error:", result.unwrapErr())
}
```

### Custom Configuration

```typescript
const retry = new Retry({
  maxAttempts: 5,           // Try up to 5 times
  baseDelay: 1000,          // Start with 1 second delay
  maxDelay: 10000,          // Cap delay at 10 seconds
  factor: 2                  // Exponential backoff multiplier
})
```

## Integration with Services

```typescript
import { CircuitBreaker, Retry } from "@domain/resilience"

export class DocumentService {
  private readonly circuitBreaker = new CircuitBreaker()
  private readonly retry = new Retry()

  async uploadDocument(file: File) {
    // Use circuit breaker for storage operations
    return await this.circuitBreaker.execute(async () => {
      // Use retry for network operations
      return await this.retry.retry(async () => {
        return await this.storageStrategy.upload(file)
      })
    })
  }
}
```

## Design Principles

- **Simple & Essential**: Only core functionality, no over-engineering
- **Result Types**: Consistent with `@carbonteq/fp` Result pattern
- **Sensible Defaults**: Works out of the box with minimal configuration
- **Domain Layer**: Belongs in domain as infrastructure concern
- **No External Dependencies**: Lightweight custom implementation for retry
- **No Environment Variables**: Hardcoded defaults for simplicity
