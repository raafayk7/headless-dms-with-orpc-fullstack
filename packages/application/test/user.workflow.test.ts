import "reflect-metadata"
import { describe, it, expect, beforeEach } from "bun:test"
import { UserWorkflows } from "../src/workflows/user.workflow"
import { RegisterUserDto, LoginUserDto } from "../src/dtos/user.dto"
import { UserEntity } from "@domain/user"
import { UserRepository } from "@domain/user/user.repository"
import { UserNotFoundError, UserAlreadyExistsError } from "@domain/user/user.errors"
import { Result } from "@carbonteq/fp"

// Mock repository for testing
class MockUserRepository implements UserRepository {
  private users: Map<string, UserEntity> = new Map()

  async create(user: UserEntity) {
    if (this.users.has(user.email)) {
      return Result.Err(new UserAlreadyExistsError(user.email as any))
    }
    this.users.set(user.email, user)
    return Result.Ok(user)
  }

  async update(user: UserEntity) {
    if (!this.users.has(user.email)) {
      return Result.Err(new UserNotFoundError(user.id as any))
    }
    this.users.set(user.email, user)
    return Result.Ok(user)
  }

  async delete(id: any) {
    const user = Array.from(this.users.values()).find(u => u.id === id)
    if (!user) {
      return Result.Err(new UserNotFoundError(id as any))
    }
    this.users.delete(user.email)
    return Result.Ok(undefined)
  }

  async findById(id: any) {
    const user = Array.from(this.users.values()).find(u => u.id === id)
    if (!user) {
      return Result.Err(new UserNotFoundError(id as any))
    }
    return Result.Ok(user)
  }

  async findByEmail(email: string) {
    const user = this.users.get(email)
    if (!user) {
      return Result.Err(new UserNotFoundError("unknown" as any))
    }
    return Result.Ok(user)
  }

  async find() {
    return Result.Ok(Array.from(this.users.values()))
  }

  async findByRole(role: "user" | "admin") {
    const users = Array.from(this.users.values()).filter(u => u.role === role)
    return Result.Ok(users)
  }

  async exists() {
    return Result.Ok(this.users.size > 0)
  }

  async count() {
    return Result.Ok(this.users.size)
  }

  async updateUserFields() {
    return Result.Err(new UserNotFoundError("unknown" as any))
  }


}

describe("UserWorkflows", () => {
  let userWorkflows: UserWorkflows
  let mockRepository: MockUserRepository

  beforeEach(() => {
    mockRepository = new MockUserRepository()
    userWorkflows = new UserWorkflows(mockRepository)
  })

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const registerDto = RegisterUserDto.create({
        email: "test@example.com",
        password: "password123",
        role: "user"
      })

      if (registerDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await userWorkflows.registerUser(registerDto.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const data = result.unwrap()
        expect(data.user.email).toBe("test@example.com" as any)
        expect(data.user.role).toBe("user")
        expect(data.message).toBe("User registered successfully")
      }
    })

    it("should fail when user already exists", async () => {
      // First registration
      const registerDto1 = RegisterUserDto.create({
        email: "test@example.com",
        password: "password123",
        role: "user"
      })

      if (registerDto1.isErr()) {
        throw new Error("Failed to create DTO")
      }

      await userWorkflows.registerUser(registerDto1.unwrap())

      // Second registration with same email
      const registerDto2 = RegisterUserDto.create({
        email: "test@example.com",
        password: "password456",
        role: "admin"
      })

      if (registerDto2.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await userWorkflows.registerUser(registerDto2.unwrap())
      
      expect(result.isErr()).toBe(true)
    })
  })

  describe("loginUser", () => {
    it("should login user with correct credentials", async () => {
      // First register a user
      const registerDto = RegisterUserDto.create({
        email: "test@example.com",
        password: "password123",
        role: "user"
      })

      if (registerDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      await userWorkflows.registerUser(registerDto.unwrap())

      // Then try to login
      const loginDto = LoginUserDto.create({
        email: "test@example.com",
        password: "password123"
      })

      if (loginDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await userWorkflows.loginUser(loginDto.unwrap())
      
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const user = result.unwrap()
        expect(user.email).toBe("test@example.com" as any)
        expect(user.role).toBe("user")
      }
    })

    it("should fail with incorrect password", async () => {
      // First register a user
      const registerDto = RegisterUserDto.create({
        email: "test@example.com",
        password: "password123",
        role: "user"
      })

      if (registerDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      await userWorkflows.registerUser(registerDto.unwrap())

      // Then try to login with wrong password
      const loginDto = LoginUserDto.create({
        email: "test@example.com",
        password: "wrongpassword"
      })

      if (loginDto.isErr()) {
        throw new Error("Failed to create DTO")
      }

      const result = await userWorkflows.loginUser(loginDto.unwrap())
      
      expect(result.isErr()).toBe(true)
    })
  })
})
