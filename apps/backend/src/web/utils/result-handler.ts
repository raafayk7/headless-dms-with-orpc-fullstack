import type { ApplicationResult } from "@application/utils/application-result.utils"
import { ORPCError } from "@orpc/server"

export const handleAppResult = <T>(result: ApplicationResult<T>): T => {
  if (!result.isErr()) {
    return result.unwrap()
  }

  const error = result.unwrapErr()
  const message = error.message || "An error occurred"

  switch (error.status) {
    case "NotFound":
      throw new ORPCError("NOT_FOUND", { message, status: 404, cause: error })

    case "Unauthorized":
      throw new ORPCError("UNAUTHORIZED", {
        message,
        status: 401,
        cause: error,
      })

    case "Forbidden":
      throw new ORPCError("FORBIDDEN", { message, status: 403, cause: error })

    case "InvalidData":
      throw new ORPCError("UNPROCESSABLE_CONTENT", {
        message,
        status: 422,
        cause: error,
      })

    case "Conflict":
      throw new ORPCError("CONFLICT", { message, status: 409, cause: error })

    case "ExternalServiceError":
      throw new ORPCError("BAD_GATEWAY", { message, status: 502, cause: error })

    default:
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message, cause: error })
  }
}
