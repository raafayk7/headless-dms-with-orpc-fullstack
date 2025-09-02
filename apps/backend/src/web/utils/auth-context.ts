import type { Context as HonoContext } from "hono"
import type { DependencyContainer } from "tsyringe"
import { AuthService } from "@/infra/auth/auth.service"

export const createAuthContext = async (
  c: HonoContext,
  container: DependencyContainer,
) => {
  const authServ = container.resolve(AuthService)

  // Convert Hono headers to Headers object
  const headers = new Headers()
  for (const [key, value] of c.req.raw.headers.entries()) {
    headers.set(key, value)
  }

  // Debug: Log the headers to see what we're getting
  console.log("🔍 Auth Debug - Headers:", Object.fromEntries(headers.entries()))
  console.log("🔍 Auth Debug - Cookie header:", headers.get("cookie"))

  const ctx = await authServ.getUser(headers)

  // Debug: Log the result
  console.log("🔍 Auth Debug - Result:", ctx.isOk() ? "SUCCESS" : "FAILED", ctx.isErr() ? ctx.unwrapErr() : "")

  return ctx
}

export type AuthContext = Awaited<ReturnType<typeof createAuthContext>>
