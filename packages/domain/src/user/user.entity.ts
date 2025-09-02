import { BaseEntity, defineEntityStruct } from "@domain/utils/base.entity"
import { Opt } from "@domain/utils/refined-types"
import { createEncoderDecoderBridge } from "@domain/utils/schema-utils"
import { Schema as S } from "effect"

// Define the User schema with DMS-specific fields
export const UserSchema = defineEntityStruct("UserId", {
  name: S.String.pipe(
    S.minLength(1),
    S.maxLength(255),
    S.brand("Name")
  ),
  email: S.String.pipe(
    S.minLength(1),
    S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    S.brand("Email")
  ),
  role: S.Union(
    S.Literal("user"),
    S.Literal("admin")
  ),
  emailVerified: S.Boolean,
})

export const UserIdSchema = UserSchema.id

export type UserType = S.Schema.Type<typeof UserSchema>
export type UserEncoded = S.Schema.Encoded<typeof UserSchema>

// Schema for creating new users (with password for Better-Auth compatibility)
export const NewUserSchema = S.Struct({
  name: S.String.pipe(
    S.minLength(1),
    S.maxLength(255),
  ),
  email: S.String.pipe(
    S.minLength(1),
    S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  ),
  password: S.String.pipe(
    S.minLength(8),
    S.maxLength(255),
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
  name: S.optional(S.String.pipe(
    S.minLength(1),
    S.maxLength(255)
  )),
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

  readonly name: UserType["name"]
  readonly email: UserType["email"]
  readonly role: UserType["role"]
  readonly emailVerified: UserType["emailVerified"]

  private constructor(data: UserType) {
    super(data)
    this.id = data.id
    this.name = data.name
    this.email = data.email
    this.role = data.role
    this.emailVerified = data.emailVerified
  }

  static from(data: UserType): UserEntity {
    return new UserEntity(data)
  }

  static fromEncoded(data: UserEncoded) {
    return bridge.deserialize(data).map((userData) => new UserEntity(userData))
  }

  // Factory method for creating new users
  static create(data: NewUserType): UserEntity {
    // Validate the input data using the schema
    const validatedData = S.decodeUnknownSync(NewUserSchema)(data)
    
    // Additional validation for role
    if (!["user", "admin"].includes(validatedData.role)) {
      throw new Error(`Invalid role: ${validatedData.role}. Must be 'user' or 'admin'`)
    }
    
    // Validate the email using the UserSchema to get the branded type
    const emailValidation = S.decodeUnknownEither(UserSchema.pipe(S.pick("email")))({ email: validatedData.email })
    if (emailValidation._tag === "Left") {
      throw new Error("Invalid email format")
    }

    // Validate the name using the UserSchema to get the branded type
    const nameValidation = S.decodeUnknownEither(UserSchema.pipe(S.pick("name")))({ name: validatedData.name })
    if (nameValidation._tag === "Left") {
      throw new Error("Invalid name format")
    }
    
    const userData: UserType = {
      ...UserSchema.baseInit(),
      name: nameValidation.right.name,
      email: emailValidation.right.email,
      role: validatedData.role,
      emailVerified: false, // Default to false for new users
    }
    return new UserEntity(userData)
  }

  // Factory method for creating from repository data
  static fromRepository(data: {
    id: string
    name: string
    email: string
    role: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }): UserEntity {
    // Validate and convert the data using the schema
    const validatedData = S.decodeUnknownSync(UserSchema)({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      emailVerified: data.emailVerified,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
    
    return new UserEntity(validatedData)
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
  updateName(newName: string): UserEntity {
    // Validate the name using the UserSchema to get the branded type
    const nameValidation = S.decodeUnknownEither(UserSchema.pipe(S.pick("name")))({ name: newName })
    if (nameValidation._tag === "Left") {
      throw new Error("Invalid name format")
    }
    
    const updatedData: UserType = {
      ...this,
      name: nameValidation.right.name,
      updatedAt: new Date() as any, // Type assertion for now
    }
    return new UserEntity(updatedData)
  }

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

  // Password management is now handled by Better-Auth in the account table

  // New method to verify email
  verifyEmail(): UserEntity {
    const updatedData: UserType = {
      ...this,
      emailVerified: true,
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
    name: string
    email: string
    role: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt as any, // Type assertion for now
      updatedAt: this.updatedAt as any, // Type assertion for now
    }
  }
}
