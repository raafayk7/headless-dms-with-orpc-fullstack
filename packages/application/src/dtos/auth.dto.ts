import { simpleSchemaDto } from "@application/utils/validation.utils"
import { Schema as S } from "effect"

// User response schema (for auth responses)
export const UserResponseSchema = S.Struct({
  id: S.String,
  email: S.String,
  role: S.Literal("user", "admin"),
  createdAt: S.Date,
  updatedAt: S.Date,
})

export class UserResponseDto extends simpleSchemaDto(
  "UserResponseDto",
  UserResponseSchema,
) {}

// Login response DTO
export const LoginResponseDtoSchema = S.Struct({
  token: S.String,
  user: UserResponseSchema,
  expiresAt: S.Date,
})

export class LoginResponseDto extends simpleSchemaDto(
  "LoginResponseDto",
  LoginResponseDtoSchema,
) {}

// Register response DTO
export const RegisterResponseDtoSchema = S.Struct({
  user: UserResponseSchema,
  message: S.String,
})

export class RegisterResponseDto extends simpleSchemaDto(
  "RegisterResponseDto",
  RegisterResponseDtoSchema,
) {}

// Success response DTO for operations like password change, role change, delete
export const SuccessResponseDtoSchema = S.Struct({
  success: S.Boolean,
  message: S.String,
})

export class SuccessResponseDto extends simpleSchemaDto(
  "SuccessResponseDto",
  SuccessResponseDtoSchema,
) {}
