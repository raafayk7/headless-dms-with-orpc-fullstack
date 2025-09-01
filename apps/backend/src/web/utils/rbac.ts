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
        throw new Error('Authentication required')
      }

      if (context.user.role !== requiredRole && context.user.role !== 'admin') {
        throw new Error('Insufficient permissions')
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
