import { appAuthenticatedBase, appAdminBase } from "@contract/utils/oc.base"
import { dtoStandardSchema } from "@application/utils/validation.utils"
import { 
  UserFiltersDto, 
  UserPaginationParamsDto,
  UpdateUserRoleDto,
  UpdateUserPasswordDto,
  UpdateUserRoleDtoSchema,
  UpdateUserPasswordDtoSchema
} from "@application/dtos/user.dto"
import { SuccessResponseDto } from "@application/dtos/auth.dto"
import { type } from "@orpc/contract"
import { Schema as S } from "effect"
import type { UserEncoded } from "@domain/user/user.entity"

const userBase = appAuthenticatedBase


// Existing whoami route
export const whoami = userBase
  .route({
    method: "GET",
    path: "/user/whoami",
    summary: "Get current user",
    tags: ["user"],
  })
  .input(type<void>())
  .output(type<UserEncoded>())

// Get users with filtering and pagination (admin only)
export const getUsers = userBase
  .route({
    method: "GET",
    path: "/user",
    summary: "Get users with optional filtering and pagination (admin only)",
    tags: ["user"],
  })
  .input(S.standardSchemaV1(S.Struct({
    page: S.optional(S.NumberFromString.pipe(S.greaterThan(0))),
    limit: S.optional(S.NumberFromString.pipe(S.greaterThan(0)).pipe(S.lessThanOrEqualTo(100))),
    email: S.optional(S.String),
    role: S.optional(S.Literal("user", "admin")),
  })))
  .output(S.standardSchemaV1(S.Struct({
    users: S.Array(S.Struct({
      id: S.String,
      email: S.String,
      role: S.Literal("user", "admin"),
      createdAt: S.String,
      updatedAt: S.String,
    })),
    pagination: S.Struct({
      page: S.Number,
      limit: S.Number,
      total: S.Number,
      totalPages: S.Number,
    })
  })))

// Get user by ID (admin only)
export const getUserById = userBase
  .route({
    method: "GET",
    path: "/user/:id",
    summary: "Get user by ID (admin only)",
    tags: ["user"],
    inputStructure: "detailed",
  })
  .input(S.standardSchemaV1(S.Struct({
    params: S.Struct({
      id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
    })
  })))
  .output(S.standardSchemaV1(S.Struct({
    id: S.String,
    email: S.String,
    role: S.Literal("user", "admin"),
    createdAt: S.String,
    updatedAt: S.String,
  })))

// Update user role (admin only)
export const updateUserRole = userBase
  .route({
    method: "PATCH",
    path: "/user/:id/role",
    summary: "Update user role (admin only)",
    tags: ["user"],
    inputStructure: "detailed",
  })
  .input(S.standardSchemaV1(S.Struct({
    params: S.Struct({
      id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
    }),
    body: UpdateUserRoleDtoSchema
  })))
  .output(dtoStandardSchema(SuccessResponseDto))



// Delete user (admin only)
export const deleteUser = userBase
  .route({
    method: "DELETE",
    path: "/user/:id",
    summary: "Delete user (admin only)",
    tags: ["user"],
    inputStructure: "detailed",
  })
  .input(S.standardSchemaV1(S.Struct({
    params: S.Struct({
      id: S.String.pipe(S.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
    })
  })))
  .output(dtoStandardSchema(SuccessResponseDto))

export default {
  whoami,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
}
