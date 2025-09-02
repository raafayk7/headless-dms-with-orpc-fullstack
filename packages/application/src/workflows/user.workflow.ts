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

      // Hash password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(dto.data.password, saltRounds)

      // Create user entity using the name from DTO
      const user = UserEntity.create(
        {
          name: dto.data.name,
          email: dto.data.email,
          password: dto.data.password, // Include password for validation
          role: dto.data.role,
        },
        passwordHash
      )

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

      // Verify password
      const isValidPassword = await bcrypt.compare(dto.data.password, user.passwordHash)
      if (!isValidPassword) {
        return ApplicationResult.fromResult(
          Result.Err(new Error("Invalid password"))
        )
      }

      // Return user data - HTTP layer will handle Better-Auth session creation
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
  ): Promise<ApplicationResult<UserEntity[]>> {
    try {
      const filterQuery = filters ? {
        email: filters.data.email,
        role: filters.data.role,
      } : undefined

      const paginationParams = pagination ? {
        page: pagination.data.page,
        limit: pagination.data.limit,
      } : undefined

      const usersResult = await this.userRepository.find(filterQuery, paginationParams)
      
      return ApplicationResult.fromResult(usersResult)
    } catch (error) {
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
    try {
      // Convert string ID to branded type - use type assertion for now
      const brandedUserId = userId as any
      const userResult = await this.userRepository.findById(brandedUserId)
      if (userResult.isErr()) {
        return ApplicationResult.fromResult(
          Result.Err(new Error(`User with id ${userId} not found`))
        )
      }

      const user = userResult.unwrap()

      // Verify current password
      const isValidCurrentPassword = await bcrypt.compare(dto.data.currentPassword, user.passwordHash)
      if (!isValidCurrentPassword) {
        return ApplicationResult.fromResult(
          Result.Err(new Error("Current password is incorrect"))
        )
      }

      // Hash new password
      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(dto.data.newPassword, saltRounds)

      // Update user with new password
      const updatedUser = user.updatePassword(newPasswordHash)
      const saveResult = await this.userRepository.update(updatedUser)

      return ApplicationResult.fromResult(
        saveResult.map(() => ({
          success: true,
          message: "Password updated successfully"
        }))
      )
    } catch (error) {
      return ApplicationResult.fromResult(
        Result.Err(error instanceof Error ? error : new Error("Failed to update password"))
      )
    }
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
