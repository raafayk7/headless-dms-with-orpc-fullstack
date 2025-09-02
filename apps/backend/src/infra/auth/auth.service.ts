import { Result } from "@carbonteq/fp"
import { UserEntity } from "@domain/user/user.entity"
import { UnauthorizedError } from "@domain/utils/base.errors"
import type { ParseError } from "effect/ParseResult"
import { injectable } from "tsyringe"
import { type AuthHandler, injectAuth } from "./better-auth"

@injectable()
export class AuthService {
  constructor(@injectAuth() private readonly auth: AuthHandler) {}

  getAuthInstance() {
    return this.auth
  }

  async getSession(headers: Headers) {
    console.log("🔍 AuthService Debug - Getting session with headers:", Object.fromEntries(headers.entries()))
    const session = await this.auth.api.getSession({
      headers,
    })
    console.log("🔍 AuthService Debug - Session result:", session ? "FOUND" : "NOT FOUND", session?.user?.email || "NO USER")
    return session
  }

  async getUser(
    headers: Headers,
  ): Promise<Result<UserEntity, UnauthorizedError | ParseError>> {
    const session = await this.getSession(headers)
    if (!session?.user) {
      return Result.Err(new UnauthorizedError("User not authenticated"))
    }

    try {
      // Convert Better-Auth user data to UserEntity format
      const userData = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || "user", // Default to "user" if role not set
        emailVerified: session.user.emailVerified || false,
        createdAt: session.user.createdAt ? new Date(session.user.createdAt) : new Date(),
        updatedAt: session.user.updatedAt ? new Date(session.user.updatedAt) : new Date(),
      }

      // Create UserEntity from repository data format
      const user = UserEntity.fromRepository(userData)
      return Result.Ok(user)
    } catch (error) {
      return Result.Err(
        error instanceof Error 
          ? error 
          : new Error("Failed to convert session user to domain entity")
      )
    }
  }

  async signOut(headers: Record<string, string | undefined>) {
    try {
      await this.auth.api.signOut({
        headers,
      })
      return true
    } catch (error) {
      console.error("Error signing out:", error)
      return false
    }
  }
}
