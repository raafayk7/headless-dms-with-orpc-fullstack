import { ORPCError } from "@orpc/server"
import type { AuthenticatedContext } from "@/web/types"

/**
 * RBAC decorator for ORPC handlers
 * Checks if the authenticated user has the required role
 */
export const requireRole = (requiredRole: 'user' | 'admin') => {
  return <T extends { context: AuthenticatedContext }>(
    handler: (params: T) => Promise<any>
  ) => {
    return async (params: T) => {
      const { context } = params
      
      if (!context.user) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Authentication required",
          status: 401
        })
      }

      if (context.user.role !== requiredRole && context.user.role !== 'admin') {
        throw new ORPCError("FORBIDDEN", {
          message: "Insufficient permissions",
          status: 403
        })
      }

      return handler(params)
    }
  }
}

/**
 * Admin-only decorator (shorthand for requireRole('admin'))
 */
export const requireAdmin = <T extends { context: AuthenticatedContext }>(
  handler: (params: T) => Promise<any>
) => {
  return requireRole('admin')(handler)
}
