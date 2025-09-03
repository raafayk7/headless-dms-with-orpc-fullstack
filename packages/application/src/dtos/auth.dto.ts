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



// Success response DTO for operations like password change, role change, delete
export const SuccessResponseDtoSchema = S.Struct({
  success: S.Boolean,
  message: S.String,
})

export class SuccessResponseDto extends simpleSchemaDto(
  "SuccessResponseDto",
  SuccessResponseDtoSchema,
) {}
