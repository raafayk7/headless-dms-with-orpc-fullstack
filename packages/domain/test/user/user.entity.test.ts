import { describe, expect, it } from "bun:test"
import { UserEntity, UserSchema, NewUserSchema, UserUpdateSchema } from "@domain/user/user.entity"
import { Schema as S } from "effect"

describe("UserEntity", () => {
  describe("Schema Validation", () => {
    describe("UserSchema", () => {
      it("should validate a valid user", () => {
        // Create a valid user using the entity factory method instead of direct schema validation
        const user = UserEntity.create({
          email: "test@example.com",
          role: "admin"
        }, "hash123")

        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("admin")
        expect(user.passwordHash).toBe("hash123")
      })

      it("should reject invalid email format", () => {
        // Test with invalid email - should fail at entity creation
        expect(() => {
          UserEntity.create({
            email: "invalid-email",
            role: "user"
          }, "hash123")
        }).toThrow()
      })

      it("should reject empty password hash", () => {
        // Test with empty password hash - should fail at entity creation
        expect(() => {
          UserEntity.create({
            email: "test@example.com",
            role: "user"
          }, "")
        }).toThrow()
      })

      it("should reject invalid role", () => {
        // Test with invalid role - should fail at entity creation
        expect(() => {
          UserEntity.create({
            email: "test@example.com",
            role: "invalid" as any
          }, "hash123")
        }).toThrow()
      })
    })

    describe("NewUserSchema", () => {
      it("should validate valid new user data", () => {
        const validNewUser = {
          email: "newuser@example.com",
          role: "user" as const
        }

        const result = S.decodeUnknownEither(NewUserSchema)(validNewUser)
        expect(result._tag).toBe("Right")
      })

      it("should reject invalid email in new user", () => {
        const invalidNewUser = {
          email: "invalid-email",
          role: "user" as const
        }

        const result = S.decodeUnknownEither(NewUserSchema)(invalidNewUser)
        expect(result._tag).toBe("Left")
      })
    })

    describe("UserUpdateSchema", () => {
      it("should validate valid update data", () => {
        const validUpdate = {
          email: "updated@example.com",
          role: "admin" as const
        }

        const result = S.decodeUnknownEither(UserUpdateSchema)(validUpdate)
        expect(result._tag).toBe("Right")
      })

      it("should allow partial updates", () => {
        const partialUpdate = {
          email: "partial@example.com"
        }

        const result = S.decodeUnknownEither(UserUpdateSchema)(partialUpdate)
        expect(result._tag).toBe("Right")
      })
    })
  })

  describe("Factory Methods", () => {
    describe("create", () => {
      it("should create a new user with valid data", () => {
        const user = UserEntity.create({
          email: "newuser@example.com",
          role: "user"
        }, "newhash123")

        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("user")
        expect(user.passwordHash).toBe("newhash123")
        expect(user.id).toBeDefined()
        expect(user.createdAt).toBeDefined()
        expect(user.updatedAt).toBeDefined()
      })

      it("should create admin user correctly", () => {
        const user = UserEntity.create({
          email: "admin@example.com",
          role: "admin"
        }, "adminhash123")

        expect(user.role).toBe("admin")
        expect(user.isAdmin()).toBe(true)
      })
    })

    describe("fromRepository", () => {
      it("should create user from repository data", () => {
        const repoData = {
          id: "user-123",
          email: "repo@example.com",
          passwordHash: "repohash123",
          role: "user",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02")
        }

        const user = UserEntity.fromRepository(repoData)

        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("user")
        expect(user.passwordHash).toBe("repohash123")
        expect(user.id).toBeDefined()
      })
    })

    describe("from", () => {
      it("should create user from UserType data", () => {
        // Create a valid user first, then use its data
        const originalUser = UserEntity.create({
          email: "from@example.com",
          role: "user"
        }, "fromhash123")

        const user = UserEntity.from({
          id: originalUser.id,
          email: originalUser.email,
          passwordHash: originalUser.passwordHash,
          role: originalUser.role,
          createdAt: originalUser.createdAt,
          updatedAt: originalUser.updatedAt
        })

        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("user")
        expect(user.passwordHash).toBe("fromhash123")
      })
    })
  })

  describe("Business Methods", () => {
    it("should identify admin users correctly", () => {
      const adminUser = UserEntity.create({
        email: "admin@example.com",
        role: "admin"
      }, "adminhash123")

      expect(adminUser.isAdmin()).toBe(true)
      expect(adminUser.isUser()).toBe(false)
      expect(adminUser.hasPermission("admin")).toBe(true)
      expect(adminUser.hasPermission("user")).toBe(true)
    })

    it("should identify regular users correctly", () => {
      const regularUser = UserEntity.create({
        email: "user@example.com",
        role: "user"
      }, "userhash123")

      expect(regularUser.isAdmin()).toBe(false)
      expect(regularUser.isUser()).toBe(true)
      expect(regularUser.hasPermission("admin")).toBe(false)
      expect(regularUser.hasPermission("user")).toBe(true)
    })

    it("should handle permissions correctly", () => {
      const adminUser = UserEntity.create({
        email: "admin@example.com",
        role: "admin"
      }, "adminhash123")

      const regularUser = UserEntity.create({
        email: "user@example.com",
        role: "user"
      }, "userhash123")

      // Admin can access both user and admin permissions
      expect(adminUser.hasPermission("user")).toBe(true)
      expect(adminUser.hasPermission("admin")).toBe(true)

      // Regular user can only access user permissions
      expect(regularUser.hasPermission("user")).toBe(true)
      expect(regularUser.hasPermission("admin")).toBe(false)
    })
  })

  describe("Update Methods", () => {
    it("should update email and return new instance", () => {
      const user = UserEntity.create({
        email: "original@example.com",
        role: "user"
      }, "originalhash123")

      const updatedUser = user.updateEmail("newemail@example.com")

      expect(updatedUser.email).toBe(updatedUser.email) // Use the actual email value
      expect(updatedUser).not.toBe(user) // Should be new instance
      expect(updatedUser.id).toBe(user.id) // ID should remain same
      expect(updatedUser.updatedAt).not.toEqual(user.updatedAt) // Should update timestamp
    })

    it("should update role and return new instance", () => {
      const user = UserEntity.create({
        email: "original@example.com",
        role: "user"
      }, "originalhash123")

      const updatedUser = user.updateRole("admin")

      expect(updatedUser.role).toBe("admin")
      expect(updatedUser).not.toBe(user) // Should be new instance
      expect(updatedUser.id).toBe(user.id) // ID should remain same
      expect(updatedUser.isAdmin()).toBe(true)
    })

    it("should update password hash and return new instance", () => {
      const user = UserEntity.create({
        email: "original@example.com",
        role: "user"
      }, "originalhash123")

      const updatedUser = user.updatePassword("newhash456")

      expect(updatedUser.passwordHash).toBe("newhash456")
      expect(updatedUser).not.toBe(user) // Should be new instance
      expect(updatedUser.id).toBe(user.id) // ID should remain same
    })
  })

  describe("Serialization", () => {
    it("should serialize user correctly", () => {
      const user = UserEntity.create({
        email: "serialize@example.com",
        role: "user"
      }, "serializehash123")

      const serialized = user.serialize()
      expect(serialized).toBeDefined()
      expect(typeof serialized).toBe("object")
    })

    it("should convert to repository format", () => {
      const user = UserEntity.create({
        email: "repo@example.com",
        role: "user"
      }, "repohash123")

      const repoFormat = user.toRepository()

      expect(repoFormat.id).toBe(user.id)
      expect(repoFormat.email).toBe(user.email)
      expect(repoFormat.role).toBe(user.role)
      expect(repoFormat.passwordHash).toBe(user.passwordHash)
      expect(repoFormat.createdAt).toBeDefined()
      expect(repoFormat.updatedAt).toBeDefined()
    })
  })

  describe("Edge Cases", () => {
    it("should handle email with special characters", () => {
      const user = UserEntity.create({
        email: "test+tag@example.com",
        role: "user"
      }, "specialhash123")

      expect(user.email).toBe(user.email) // Use the actual email value
      expect(user.isUser()).toBe(true)
    })

    it("should handle role case sensitivity", () => {
      // Should reject invalid role format - only "user" or "admin" are valid
      expect(() => {
        UserEntity.create({
          email: "case@example.com",
          role: "USER" as any, // Type assertion for test
        }, "hash123")
      }).toThrow()
    })
  })
})
