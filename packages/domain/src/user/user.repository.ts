import type { Result } from "@carbonteq/fp"
import type { RepoResult } from "@domain/utils"
import type { UserEntity, UserType, UserUpdateType } from "./user.entity"
import type { UserNotFoundError, UserAlreadyExistsError } from "./user.errors"

export interface UserFilterQuery {
  email?: string
  role?: "user" | "admin"
}

export abstract class UserRepository {
  // Essential CRUD operations
  abstract create(user: UserEntity): Promise<Result<UserEntity, UserAlreadyExistsError>>
  abstract update(user: UserEntity): Promise<RepoResult<UserEntity, UserNotFoundError>>
  abstract delete(id: UserType["id"]): Promise<Result<void, UserNotFoundError>>
  
  // Essential query operations
  abstract findById(id: UserType["id"]): Promise<RepoResult<UserEntity, UserNotFoundError>>
  abstract findByEmail(email: string): Promise<RepoResult<UserEntity, UserNotFoundError>>
  
  // Essential pagination and filtering
  abstract find(query?: UserFilterQuery, pagination?: { page?: number; limit?: number }): Promise<Result<{ users: UserEntity[]; total: number }, Error>>
  
  // Essential business operations
  abstract findByRole(role: "user" | "admin"): Promise<Result<UserEntity[], Error>>
  abstract exists(query: UserFilterQuery): Promise<Result<boolean, Error>>
  abstract count(query?: UserFilterQuery): Promise<Result<number, Error>>
  
  // DMS-specific operations
  abstract updateUserFields(
    id: UserType["id"], 
    updates: UserUpdateType
  ): Promise<RepoResult<UserEntity, UserNotFoundError>>
  
  // Authentication operations are now handled by Better-Auth
}
