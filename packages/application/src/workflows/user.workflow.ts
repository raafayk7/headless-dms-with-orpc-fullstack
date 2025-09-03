import {
  UpdateUserRoleDto,
  UserFiltersDto,
  UserPaginationParamsDto,
} from "@application/dtos/user.dto"
import { ApplicationResult } from "@application/utils/application-result.utils"
import { Result } from "@carbonteq/fp"
import { UserEntity, UserRepository } from "@domain/user"
import { UserNotFoundError } from "@domain/user/user.errors"
import { autoInjectable } from "tsyringe"


@autoInjectable()
export class UserWorkflows {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}



  async getUsers(
    currentUser: UserEntity,
    filters?: UserFiltersDto,
    pagination?: UserPaginationParamsDto
  ): Promise<ApplicationResult<{ users: UserEntity[]; total: number }>> {
    try {
      // Domain-level RBAC guard
      if (!currentUser.isAdmin()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error("Insufficient permissions: Admin access required"))
        )
      }

      console.log("🔍 Workflow Debug - Filters:", filters)
      console.log("🔍 Workflow Debug - Pagination:", pagination)
      
      const filterQuery = filters ? {
        email: filters.data.email,
        role: filters.data.role,
      } : undefined

      const paginationParams = pagination ? {
        page: pagination.data.page,
        limit: pagination.data.limit,
      } : undefined

      console.log("🔍 Workflow Debug - Filter query:", filterQuery)
      console.log("🔍 Workflow Debug - Pagination params:", paginationParams)

      const result = await this.userRepository.find(filterQuery, paginationParams)
      
      if (result.isErr()) {
        console.error("🔍 Workflow Debug - Repository error:", result.unwrapErr())
      } else {
        console.log("🔍 Workflow Debug - Repository success:", result.unwrap())
      }
      
      return ApplicationResult.fromResult(result)
    } catch (error) {
      console.error("🔍 Workflow Debug - Catch error:", error)
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to get users"))
      )
    }
  }

  async getUserById(currentUser: UserEntity, id: string): Promise<ApplicationResult<UserEntity>> {
    try {
      // Domain-level RBAC guard
      if (!currentUser.isAdmin()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error("Insufficient permissions: Admin access required"))
        )
      }

      // Convert string ID to branded type - use type assertion for now
      const userId = id as any
      const userResult = await this.userRepository.findById(userId)
      return ApplicationResult.fromResult(userResult)
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to get user"))
      )
    }
  }



  async updateUserRole(
    currentUser: UserEntity,
    targetUserId: string,
    dto: UpdateUserRoleDto
  ): Promise<ApplicationResult<{ success: boolean; message: string }>> {
    try {
      // Domain-level RBAC guard
      if (!currentUser.isAdmin()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error("Insufficient permissions: Admin access required"))
        )
      }

      // Convert string ID to branded type - use type assertion for now
      const brandedUserId = targetUserId as any
      
      // Use updateUserFields for simpler partial update
      const saveResult = await this.userRepository.updateUserFields(brandedUserId, {
        role: dto.data.newRole
      })

      return ApplicationResult.fromResult(
        saveResult.map(() => ({
          success: true,
          message: `User role updated to ${dto.data.newRole}`
        }))
      )
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to update user role"))
      )
    }
  }

  async deleteUser(currentUser: UserEntity, targetUserId: string): Promise<ApplicationResult<{ success: boolean; message: string }>> {
    try {
      // Domain-level RBAC guard
      if (!currentUser.isAdmin()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error("Insufficient permissions: Admin access required"))
        )
      }

      // Convert string ID to branded type - use type assertion for now
      const brandedUserId = targetUserId as any
      
      // Delete user directly - repository handles "not found" case
      const deleteResult = await this.userRepository.delete(brandedUserId)

      return ApplicationResult.fromResult(
        deleteResult.map(() => ({
          success: true,
          message: "User deleted successfully"
        }))
      )
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to delete user"))
      )
    }
  }
}
