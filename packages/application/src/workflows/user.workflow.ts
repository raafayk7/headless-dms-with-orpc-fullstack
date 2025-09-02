import {
  RegisterUserDto,
  LoginUserDto,
  UpdateUserPasswordDto,
  UpdateUserRoleDto,
  UserFiltersDto,
  UserPaginationParamsDto,
} from "@application/dtos/user.dto"
import { ApplicationResult } from "@application/utils/application-result.utils"
import { Result } from "@carbonteq/fp"
import { UserEntity, UserRepository } from "@domain/user"
import { UserNotFoundError, UserAlreadyExistsError } from "@domain/user/user.errors"
import { autoInjectable } from "tsyringe"
import bcrypt from "bcryptjs"

@autoInjectable()
export class UserWorkflows {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<ApplicationResult<{ user: UserEntity; message: string }>> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(dto.data.email)
      if (existingUser.isOk()) {
        return ApplicationResult.fromResult(
          Result.Err(new UserAlreadyExistsError(dto.data.email))
        )
      }

      // Create user entity using the name from DTO
      // Password will be handled by Better-Auth in the account table
      const user = UserEntity.create({
        name: dto.data.name,
        email: dto.data.email,
        password: dto.data.password, // Include password for validation
        role: dto.data.role,
      })

      // Save to repository
      const saveResult = await this.userRepository.create(user)
      
      return ApplicationResult.fromResult(
        saveResult.map((savedUser) => ({
          user: savedUser,
          message: "User registered successfully"
        }))
      )
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to register user"))
      )
    }
  }

  async loginUser(dto: LoginUserDto): Promise<ApplicationResult<UserEntity>> {
    try {
      // Find user by email
      const userResult = await this.userRepository.findByEmail(dto.data.email)
      if (userResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error(`User with email ${dto.data.email} not found`))
        )
      }

      const user = userResult.unwrap()

      // Password verification is now handled by Better-Auth
      // This method is kept for compatibility but Better-Auth handles authentication
      return ApplicationResult.fromResult(
        Result.Ok(user)
      )
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to login user"))
      )
    }
  }

  async getUsers(
    filters?: UserFiltersDto,
    pagination?: UserPaginationParamsDto
  ): Promise<ApplicationResult<{ users: UserEntity[]; total: number }>> {
    try {
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

  async getUserById(id: string): Promise<ApplicationResult<UserEntity>> {
    try {
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

  async updateUserPassword(
    userId: string,
    dto: UpdateUserPasswordDto
  ): Promise<ApplicationResult<{ success: boolean; message: string }>> {
    // Password updates are now handled by Better-Auth
    // This method is kept for API compatibility but should redirect to Better-Auth
    return ApplicationResult.fromResult(
      Result.Err(new Error("Password updates are handled by Better-Auth. Use /auth/change-password endpoint."))
    )
  }

  async updateUserRole(
    targetUserId: string,
    dto: UpdateUserRoleDto
  ): Promise<ApplicationResult<{ success: boolean; message: string }>> {
    try {
      // Convert string ID to branded type - use type assertion for now
      const brandedUserId = targetUserId as any
      const userResult = await this.userRepository.findById(brandedUserId)
      if (userResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error(`User with id ${targetUserId} not found`))
        )
      }

      const user = userResult.unwrap()

      // Update user role
      const updatedUser = user.updateRole(dto.data.newRole)
      const saveResult = await this.userRepository.update(updatedUser)

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

  async deleteUser(targetUserId: string): Promise<ApplicationResult<{ success: boolean; message: string }>> {
    try {
      // Convert string ID to branded type - use type assertion for now
      const brandedUserId = targetUserId as any
      const userResult = await this.userRepository.findById(brandedUserId)
      if (userResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error(`User with id ${targetUserId} not found`))
        )
      }

      // Delete user
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
