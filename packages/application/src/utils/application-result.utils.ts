import { Result, type UNIT } from "@carbonteq/fp"
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@domain/utils/base.errors"
import { ParseError } from "effect/ParseResult"

export enum AppErrStatus {
  NotFound = "NotFound",
  Unauthorized = "Unauthorized",
  Forbidden = "Forbidden",
  InvalidData = "InvalidData",
  Conflict = "Conflict",
  InternalError = "InternalError",
  ExternalServiceError = "ExternalServiceError",
  Generic = "Generic",
}

export class AppError extends Error {
  private constructor(
    readonly status: AppErrStatus,
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause })
  }

  static NotFound = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.NotFound, msg, cause)

  static Unauthorized = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.Unauthorized, msg, cause)

  static Forbidden = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.Forbidden, msg, cause)

  static InvalidData = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.InvalidData, msg, cause)

  static Conflict = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.Conflict, msg, cause)

  static InternalError = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.InternalError, msg, cause)

  static ExternalServiceError = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.ExternalServiceError, msg, cause)

  static Generic = (msg: string, cause?: unknown): AppError =>
    new AppError(AppErrStatus.Generic, msg, cause)

  static fromErr = (e: Error): AppError => {
    if (e instanceof AppError) {
      return new AppError(e.status, e.message, e)
    }

    if (e instanceof NotFoundError) {
      return AppError.NotFound(e.message, e)
    }

    if (e instanceof UnauthorizedError) {
      return AppError.Unauthorized(e.message, e)
    }

    if (e instanceof ForbiddenError) {
      return AppError.Forbidden(e.message, e)
    }

    if (e instanceof ValidationError || e instanceof ParseError) {
      return AppError.InvalidData(e.message, e)
    }

    if (e instanceof ConflictError) {
      return AppError.Conflict(e.message, e)
    }

    if (e instanceof InternalError) {
      return AppError.InternalError(e.message, e)
    }

    if (e instanceof ExternalServiceError) {
      return AppError.ExternalServiceError(e.message, e)
    }

    // Fallback for unknown errors
    return AppError.Generic(e.message, e)
  }
}

type InnerResult<T> = Result<T, AppError>

export type EmptyResult = typeof ApplicationResult.EMPTY

export class ApplicationResult<T> {
  static readonly EMPTY: ApplicationResult<UNIT> = new ApplicationResult(
    Result.UNIT_RESULT,
  )

  private constructor(private readonly inner_result: InnerResult<T>) {}

  isOk(): boolean {
    return this.inner_result.isOk()
  }

  isErr(): this is ApplicationResult<never> {
    return this.inner_result.isErr()
  }

  static Ok<T>(val: T): ApplicationResult<T> {
    return new ApplicationResult(Result.Ok(val))
  }

  static Err(err: Error): ApplicationResult<never> {
    const e = AppError.fromErr(err)
    return new ApplicationResult<never>(Result.Err(e))
  }

  static fromResult<T, E extends Error>(
    result: Result<T, E>,
  ): ApplicationResult<T> {
    const r = result.mapErr((e) => AppError.fromErr(e))
    return new ApplicationResult(r)
  }

  toResult(): Result<T, AppError> {
    return this.inner_result
  }

  flatMap<U>(f: (r: T) => Result<U, AppError>): ApplicationResult<U> {
    return new ApplicationResult(this.inner_result.flatMap(f))
  }

  unwrap(): T {
    return this.inner_result.unwrap()
  }

  unwrapErr(): AppError {
    return this.inner_result.unwrapErr()
  }

  map<U>(fn: (val: T) => U): ApplicationResult<U> {
    const newResult = this.inner_result.map(fn)
    return new ApplicationResult(newResult)
  }

  mapErr(fn: (err: AppError) => AppError): ApplicationResult<T> {
    return new ApplicationResult(this.inner_result.mapErr(fn))
  }

  safeUnwrap(): T | null {
    return this.inner_result.safeUnwrap()
  }

  // zip<U>(fn: (r: T) => U): ApplicationResult<[T, U]> {
  //   return new ApplicationResult(this.inner_result.zip(fn))
  // }

  // flatZip<U>(f: (r: T) => Result<U, AppError>): ApplicationResult<[T, U]> {
  //   return new ApplicationResult(this.inner_result.flatZip(f))
  // }
}
