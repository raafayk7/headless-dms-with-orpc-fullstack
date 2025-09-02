import { simpleSchemaDto } from "@application/utils/validation.utils"
import { Schema as S } from "effect"

// User registration DTO
export const RegisterUserDtoSchema = S.Struct({
  name: S.String.pipe(
    S.minLength(1),
    S.maxLength(255),
  ),
  email: S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: S.String.pipe(S.minLength(8)),
  role: S.Literal("user", "admin"),
})

export class RegisterUserDto extends simpleSchemaDto(
  "RegisterUserDto",
  RegisterUserDtoSchema,
) {}

// User login DTO
export const LoginUserDtoSchema = S.Struct({
  email: S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: S.String.pipe(S.minLength(1)),
})

export class LoginUserDto extends simpleSchemaDto(
  "LoginUserDto",
  LoginUserDtoSchema,
) {}

// Update user password DTO
export const UpdateUserPasswordDtoSchema = S.Struct({
  currentPassword: S.String.pipe(S.minLength(1)),
  newPassword: S.String.pipe(S.minLength(8)),
})

export class UpdateUserPasswordDto extends simpleSchemaDto(
  "UpdateUserPasswordDto",
  UpdateUserPasswordDtoSchema,
) {}

// Update user role DTO
export const UpdateUserRoleDtoSchema = S.Struct({
  newRole: S.Literal("user", "admin"),
})

export class UpdateUserRoleDto extends simpleSchemaDto(
  "UpdateUserRoleDto",
  UpdateUserRoleDtoSchema,
) {}

// User filters for getUsers
export const UserFiltersSchema = S.Struct({
  name: S.optional(S.String),
  email: S.optional(S.String),
  role: S.optional(S.Literal("user", "admin")),
})

export class UserFiltersDto extends simpleSchemaDto(
  "UserFiltersDto",
  UserFiltersSchema,
) {}

// Pagination parameters - renamed to avoid conflict
export const UserPaginationParamsSchema = S.Struct({
  page: S.Number.pipe(S.greaterThan(0)),
  limit: S.Number.pipe(S.greaterThan(0)).pipe(S.lessThanOrEqualTo(100)),
})

export class UserPaginationParamsDto extends simpleSchemaDto(
  "UserPaginationParamsDto",
  UserPaginationParamsSchema,
) {}
