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
    return await this.auth.api.getSession({
      headers,
    })
  }

  async getUser(
    headers: Headers,
  ): Promise<Result<UserEntity, UnauthorizedError | ParseError>> {
    const session = await this.getSession(headers)
    if (!session?.user) {
      // TODO: unauthorized error
      return Result.Err(new UnauthorizedError("User not authenticated"))
    }

    const user = UserEntity.fromEncoded({
      ...session.user,
      image: session.user.image || null,
    })

    return user
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
