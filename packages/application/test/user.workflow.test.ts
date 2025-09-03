import "reflect-metadata"
import { describe, it, expect, beforeEach } from "bun:test"
import { UserWorkflows } from "../src/workflows/user.workflow"

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
    const users = Array.from(this.users.values())
    return Result.Ok({ users, total: users.length })
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


})
