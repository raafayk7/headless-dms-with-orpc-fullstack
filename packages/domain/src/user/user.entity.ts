import { BaseEntity, defineEntityStruct } from "@domain/utils/base.entity"
import { Opt } from "@domain/utils/refined-types"
import { createEncoderDecoderBridge } from "@domain/utils/schema-utils"
import { Schema as S } from "effect"

// Define the User schema with DMS-specific fields
export const UserSchema = defineEntityStruct("UserId", {
  email: S.String.pipe(
    S.minLength(1),
    S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    S.brand("Email")
  ),
  passwordHash: S.String.pipe(S.minLength(1)),
  role: S.Union(
    S.Literal("user"),
    S.Literal("admin")
  ),
})

export const UserIdSchema = UserSchema.id

export type UserType = S.Schema.Type<typeof UserSchema>
export type UserEncoded = S.Schema.Encoded<typeof UserSchema>

// Schema for creating new users (without passwordHash)
export const NewUserSchema = S.Struct({
  email: S.String.pipe(
    S.minLength(1),
    S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  ),
  role: S.Union(
    S.Literal("user"),
    S.Literal("admin")
  ),
})
export type NewUserType = S.Schema.Type<typeof NewUserSchema>
export type NewUserEncoded = S.Schema.Encoded<typeof NewUserSchema>

// Schema for user updates
export const UserUpdateSchema = S.Struct({
  email: S.optional(S.String.pipe(S.minLength(1), S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))),
  role: S.optional(S.Union(
    S.Literal("user"),
    S.Literal("admin")
  )),
})
export type UserUpdateType = S.Schema.Type<typeof UserUpdateSchema>
export type UserUpdateEncoded = S.Schema.Encoded<typeof UserUpdateSchema>

const bridge = createEncoderDecoderBridge(UserSchema)

export class UserEntity extends BaseEntity implements UserType {
  override readonly id: UserType["id"]

  readonly email: UserType["email"]
  readonly passwordHash: string
  readonly role: UserType["role"]

  private constructor(data: UserType) {
    super(data)
    this.id = data.id
    this.email = data.email
    this.passwordHash = data.passwordHash
    this.role = data.role
  }

  static from(data: UserType): UserEntity {
    return new UserEntity(data)
  }

  static fromEncoded(data: UserEncoded) {
    return bridge.deserialize(data).map((userData) => new UserEntity(userData))
  }

  // Factory method for creating new users
  static create(data: NewUserType, passwordHash: string): UserEntity {
    // Validate the input data using the schema
    const validatedData = S.decodeUnknownSync(NewUserSchema)(data)
    
    // Additional validation for password hash
    if (!passwordHash || passwordHash.trim().length === 0) {
      throw new Error("Password hash cannot be empty")
    }
    
    // Additional validation for role
    if (!["user", "admin"].includes(validatedData.role)) {
      throw new Error(`Invalid role: ${validatedData.role}. Must be 'user' or 'admin'`)
    }
    
    // Validate the email using the UserSchema to get the branded type
    const emailValidation = S.decodeUnknownEither(UserSchema.pipe(S.pick("email")))({ email: validatedData.email })
    if (emailValidation._tag === "Left") {
      throw new Error("Invalid email format")
    }
    
    const userData: UserType = {
      ...UserSchema.baseInit(),
      email: emailValidation.right.email,
      passwordHash,
      role: validatedData.role,
    }
    return new UserEntity(userData)
  }

  // Factory method for creating from repository data
  static fromRepository(data: {
    id: string
    email: string
    passwordHash: string
    role: string
    createdAt: Date
    updatedAt: Date
  }): UserEntity {
    // Convert Date to the proper DateTime type expected by the schema
    const userData: UserType = {
      id: UserIdSchema.new(), // Use new() instead of fromTrusted
      email: data.email as UserType["email"],
      passwordHash: data.passwordHash,
      role: data.role as UserType["role"],
      createdAt: data.createdAt as any, // Type assertion for now
      updatedAt: data.updatedAt as any, // Type assertion for now
    }
    return new UserEntity(userData)
  }

  // Business methods
  isAdmin(): boolean {
    return this.role === "admin"
  }

  isUser(): boolean {
    return this.role === "user"
  }

  hasPermission(requiredRole: "user" | "admin"): boolean {
    if (requiredRole === "user") {
      return this.isUser() || this.isAdmin()
    }
    return this.isAdmin()
  }

  // Update methods that return new instances
  updateEmail(newEmail: string): UserEntity {
    // Validate the email using the UserSchema to get the branded type
    const emailValidation = S.decodeUnknownEither(UserSchema.pipe(S.pick("email")))({ email: newEmail })
    if (emailValidation._tag === "Left") {
      throw new Error("Invalid email format")
    }
    
    const updatedData: UserType = {
      ...this,
      email: emailValidation.right.email,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new UserEntity(updatedData)
  }

  updateRole(newRole: "user" | "admin"): UserEntity {
    const updatedData: UserType = {
      ...this,
      role: newRole,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new UserEntity(updatedData)
  }

  updatePassword(newPasswordHash: string): UserEntity {
    const updatedData: UserType = {
      ...this,
      passwordHash: newPasswordHash,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new UserEntity(updatedData)
  }

  serialize() {
    return bridge.serialize(this)
  }

  // Convert to repository format
  toRepository(): {
    id: string
    email: string
    passwordHash: string
    role: string
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      role: this.role,
      createdAt: this.createdAt as any, // Type assertion for now
      updatedAt: this.updatedAt as any, // Type assertion for now
    }
  }
}
