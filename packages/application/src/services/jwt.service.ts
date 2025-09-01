import { injectable } from "tsyringe"
import { Result } from "@carbonteq/fp"
import jwt from "jsonwebtoken"

@injectable()
export class JwtService {
  private readonly secret: string

  constructor() {
    this.secret = process.env.DOWNLOAD_JWT_SECRET || "default-secret-change-in-production"
  }

  /**
   * Generate a JWT token for document download
   */
  async generateToken(documentId: string, expiresInMinutes: number = 5): Promise<string> {
    const payload = {
      documentId,
      exp: Math.floor(Date.now() / 1000) + (expiresInMinutes * 60), // Convert minutes to seconds
      iat: Math.floor(Date.now() / 1000), // Issued at
    }

    return jwt.sign(payload, this.secret)
  }

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(token: string): Promise<Result<string, Error>> {
    try {
      const payload = jwt.verify(token, this.secret) as any
      
      if (!payload.documentId) {
        return Result.Err(new Error("Invalid token payload - missing document ID"))
      }
      
      return Result.Ok(payload.documentId)
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return Result.Err(new Error("Invalid download token"))
      } else if (error instanceof jwt.TokenExpiredError) {
        return Result.Err(new Error("Download token has expired"))
      } else if (error instanceof jwt.NotBeforeError) {
        return Result.Err(new Error("Download token not yet valid"))
      } else {
        return Result.Err(new Error("Invalid or expired download token"))
      }
    }
  }

  /**
   * Decode token without verification (for internal use)
   */
  async decodeToken(token: string): Promise<Result<string, Error>> {
    try {
      const payload = jwt.decode(token) as any
      
      if (!payload || !payload.documentId) {
        return Result.Err(new Error("Invalid token payload - missing document ID"))
      }
      
      return Result.Ok(payload.documentId)
    } catch (error) {
      return Result.Err(new Error("Failed to decode token"))
    }
  }
}
