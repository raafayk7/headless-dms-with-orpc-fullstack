import type { Result } from "@carbonteq/fp"
import type { RepoResult } from "@domain/utils"
import type { UserEntity, UserType, UserUpdateType } from "./user.entity"
import type { UserNotFoundError, UserAlreadyExistsError } from "./user.errors"

export interface UserFilterQuery {
  email?: string
  role?: "user" | "admin"
}

export interface UserRepository {
  // Essential CRUD operations
  create(user: UserEntity): Promise<Result<UserEntity, UserAlreadyExistsError>>
  update(user: UserEntity): Promise<RepoResult<UserEntity, UserNotFoundError>>
  delete(id: UserType["id"]): Promise<Result<void, UserNotFoundError>>
  
  // Essential query operations
  findById(id: UserType["id"]): Promise<RepoResult<UserEntity, UserNotFoundError>>
  findByEmail(email: string): Promise<RepoResult<UserEntity, UserNotFoundError>>
  
  // Essential pagination and filtering
  find(query?: UserFilterQuery, pagination?: { page: number; limit: number }): Promise<Result<UserEntity[], Error>>
  
  // Essential business operations
  findByRole(role: "user" | "admin"): Promise<Result<UserEntity[], Error>>
  exists(query: UserFilterQuery): Promise<Result<boolean, Error>>
  count(query?: UserFilterQuery): Promise<Result<number, Error>>
  
  // DMS-specific operations
  updateUserFields(
    id: UserType["id"], 
    updates: UserUpdateType
  ): Promise<RepoResult<UserEntity, UserNotFoundError>>
  
  // Authentication operations
  findByEmailAndPassword(
    email: string, 
    passwordHash: string
  ): Promise<RepoResult<UserEntity, UserNotFoundError>>
}
