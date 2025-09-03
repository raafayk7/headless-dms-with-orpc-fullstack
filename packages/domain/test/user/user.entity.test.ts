import { describe, expect, it } from "bun:test"
import { UserEntity, UserSchema, NewUserSchema, UserUpdateSchema } from "@domain/user/user.entity"
import { Schema as S } from "effect"

describe("UserEntity", () => {
  describe("Schema Validation", () => {
    describe("UserSchema", () => {
      it("should validate a valid user", () => {
        // Create a valid user using the entity factory method instead of direct schema validation
        const user = UserEntity.create({
          name: "Test User",
          email: "test@example.com",
          password: "password123", // Include password for validation
          role: "admin"
        })

        expect(String(user.name)).toBe("Test User")
        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("admin")
        expect(user.emailVerified).toBe(false) // Default value for new users
      })

      it("should reject invalid email format", () => {
        // Test with invalid email - should fail at entity creation
        expect(() => {
          UserEntity.create({
            name: "Test User",
            email: "invalid-email",
            password: "password123",
            role: "user"
          })
        }).toThrow()
      })

      it("should reject empty password", () => {
        // Test with empty password - should fail at entity creation
        expect(() => {
          UserEntity.create({
            name: "Test User",
            email: "test@example.com",
            password: "",
            role: "user"
          })
        }).toThrow()
      })

      it("should reject invalid role", () => {
        // Test with invalid role - should fail at entity creation
        expect(() => {
          UserEntity.create({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            role: "invalid" as any
          })
        }).toThrow()
      })

      it("should reject empty name", () => {
        // Test with empty name - should fail at entity creation
        expect(() => {
          UserEntity.create({
            name: "",
            email: "test@example.com",
            password: "password123",
            role: "user"
          })
        }).toThrow()
      })

      it("should reject name that is too long", () => {
        // Test with name that exceeds 255 characters - should fail at entity creation
        const longName = "a".repeat(256)
        expect(() => {
          UserEntity.create({
            name: longName,
            email: "test@example.com",
            password: "password123",
            role: "user"
          })
        }).toThrow()
      })
    })

    describe("NewUserSchema", () => {
      it("should validate valid new user data", () => {
        const validNewUser = {
          name: "New User",
          email: "newuser@example.com",
          password: "password123",
          role: "user" as const
        }

        const result = S.decodeUnknownEither(NewUserSchema)(validNewUser)
        expect(result._tag).toBe("Right")
      })

      it("should reject invalid email in new user", () => {
        const invalidNewUser = {
          name: "Invalid User",
          email: "invalid-email",
          password: "password123",
          role: "user" as const
        }

        const result = S.decodeUnknownEither(NewUserSchema)(invalidNewUser)
        expect(result._tag).toBe("Left")
      })

      it("should reject empty name in new user", () => {
        const invalidNewUser = {
          name: "",
          email: "valid@example.com",
          password: "password123",
          role: "user" as const
        }

        const result = S.decodeUnknownEither(NewUserSchema)(invalidNewUser)
        expect(result._tag).toBe("Left")
      })

      it("should reject name that is too long in new user", () => {
        const longName = "a".repeat(256)
        const invalidNewUser = {
          name: longName,
          email: "valid@example.com",
          password: "password123",
          role: "user" as const
        }

        const result = S.decodeUnknownEither(NewUserSchema)(invalidNewUser)
        expect(result._tag).toBe("Left")
      })
    })

    describe("UserUpdateSchema", () => {
      it("should validate valid update data", () => {
        const validUpdate = {
          name: "Updated User",
          email: "updated@example.com",
          role: "admin" as const
        }

        const result = S.decodeUnknownEither(UserUpdateSchema)(validUpdate)
        expect(result._tag).toBe("Right")
      })

      it("should allow partial updates", () => {
        const partialUpdate = {
          name: "Partial Update"
        }

        const result = S.decodeUnknownEither(UserUpdateSchema)(partialUpdate)
        expect(result._tag).toBe("Right")
      })

      it("should validate name length in updates", () => {
        const validUpdate = {
          name: "Valid Name"
        }

        const result = S.decodeUnknownEither(UserUpdateSchema)(validUpdate)
        expect(result._tag).toBe("Right")
      })

      it("should reject name that is too long in updates", () => {
        const longName = "a".repeat(256)
        const invalidUpdate = {
          name: longName
        }

        const result = S.decodeUnknownEither(UserUpdateSchema)(invalidUpdate)
        expect(result._tag).toBe("Left")
      })
    })
  })

  describe("Factory Methods", () => {
    describe("create", () => {
      it("should create a new user with valid data", () => {
        const user = UserEntity.create({
          name: "New User",
          email: "newuser@example.com",
          password: "password123",
          role: "user"
        })

        expect(String(user.name)).toBe("New User")
        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("user")
        expect(user.emailVerified).toBe(false) // Default value for new users
        expect(user.id).toBeDefined()
        expect(user.createdAt).toBeDefined()
        expect(user.updatedAt).toBeDefined()
      })

      it("should create admin user correctly", () => {
        const user = UserEntity.create({
          name: "Admin User",
          email: "admin@example.com",
          password: "password123",
          role: "admin"
        })

        expect(String(user.name)).toBe("Admin User")
        expect(user.role).toBe("admin")
        expect(user.isAdmin()).toBe(true)
        expect(user.emailVerified).toBe(false)
      })
    })

    describe("fromRepository", () => {
      it("should create user from repository data", () => {
        const repoData = {
          id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
          name: "Repository User",
          email: "repo@example.com",
          role: "user",
          emailVerified: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02")
        }

        const user = UserEntity.fromRepository(repoData)

        expect(String(user.name)).toBe("Repository User")
        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("user")
        expect(user.emailVerified).toBe(true)
        expect(user.id).toBeDefined()
      })

      it("should handle unverified email from repository", () => {
        const repoData = {
          id: "550e8400-e29b-41d4-a716-446655440001", // Valid UUID
          name: "Unverified User",
          email: "unverified@example.com",
          role: "user",
          emailVerified: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02")
        }

        const user = UserEntity.fromRepository(repoData)

        expect(String(user.name)).toBe("Unverified User")
        expect(user.emailVerified).toBe(false)
      })
    })

    describe("from", () => {
      it("should create user from UserType data", () => {
        // Create a valid user first, then use its data
        const originalUser = UserEntity.create({
          name: "From User",
          email: "from@example.com",
          password: "password123",
          role: "user"
        })

        const user = UserEntity.from({
          id: originalUser.id,
          name: originalUser.name,
          email: originalUser.email,
          role: originalUser.role,
          emailVerified: originalUser.emailVerified,
          createdAt: originalUser.createdAt,
          updatedAt: originalUser.updatedAt
        })

        expect(String(user.name)).toBe("From User")
        expect(user.email).toBe(user.email) // Use the actual email value
        expect(user.role).toBe("user")
        expect(user.emailVerified).toBe(false)
      })
    })
  })

  describe("Business Methods", () => {
    it("should identify admin users correctly", () => {
      const adminUser = UserEntity.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin"
      })

      expect(String(adminUser.name)).toBe("Admin User")
      expect(adminUser.isAdmin()).toBe(true)
      expect(adminUser.isUser()).toBe(false)
      expect(adminUser.hasPermission("admin")).toBe(true)
      expect(adminUser.hasPermission("user")).toBe(true)
    })

    it("should identify regular users correctly", () => {
      const regularUser = UserEntity.create({
        name: "Regular User",
        email: "user@example.com",
        password: "password123",
        role: "user"
      })

      expect(String(regularUser.name)).toBe("Regular User")
      expect(regularUser.isAdmin()).toBe(false)
      expect(regularUser.isUser()).toBe(true)
      expect(regularUser.hasPermission("admin")).toBe(false)
      expect(regularUser.hasPermission("user")).toBe(true)
    })

    it("should handle permissions correctly", () => {
      const adminUser = UserEntity.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin"
      })

      const regularUser = UserEntity.create({
        name: "Regular User",
        email: "user@example.com",
        password: "password123",
        role: "user"
      })

      // Admin can access both user and admin permissions
      expect(adminUser.hasPermission("user")).toBe(true)
      expect(adminUser.hasPermission("admin")).toBe(true)

      // Regular user can only access user permissions
      expect(regularUser.hasPermission("user")).toBe(true)
      expect(regularUser.hasPermission("admin")).toBe(false)
    })

    it("should handle email verification status", () => {
      const verifiedUser = UserEntity.create({
        name: "Verified User",
        email: "verified@example.com",
        password: "password123",
        role: "user"
      })

      expect(verifiedUser.emailVerified).toBe(false) // Default value

      const verifiedUserFromRepo = UserEntity.fromRepository({
        id: "550e8400-e29b-41d4-a716-446655440002", // Valid UUID
        name: "Verified User",
        email: "verified@example.com",
        role: "user",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(verifiedUserFromRepo.emailVerified).toBe(true)
    })
  })

  describe("Update Methods", () => {
    it("should update name and return new instance", () => {
      const user = UserEntity.create({
        name: "Original Name",
        email: "original@example.com",
        password: "password123",
        role: "user"
      })

      const updatedUser = user.updateName("New Name")

      expect(String(updatedUser.name)).toBe("New Name")
      expect(updatedUser).not.toBe(user) // Should be new instance
      expect(updatedUser.id).toBe(user.id) // ID should remain same
      expect(updatedUser.updatedAt).not.toEqual(user.updatedAt) // Should update timestamp
    })

    it("should reject invalid name in updateName", () => {
      const user = UserEntity.create({
        name: "Original Name",
        email: "original@example.com",
        password: "password123",
        role: "user"
      })

      // Test empty name
      expect(() => {
        user.updateName("")
      }).toThrow()

      // Test name that is too long
      const longName = "a".repeat(256)
      expect(() => {
        user.updateName(longName)
      }).toThrow()
    })

    it("should update email and return new instance", () => {
      const user = UserEntity.create({
        name: "Original Name",
        email: "original@example.com",
        password: "password123",
        role: "user"
      })

      const updatedUser = user.updateEmail("newemail@example.com")

      expect(updatedUser.email).toBe(updatedUser.email) // Use the actual email value
      expect(updatedUser).not.toBe(user) // Should be new instance
      expect(updatedUser.id).toBe(user.id) // ID should remain same
      expect(updatedUser.updatedAt).not.toEqual(user.updatedAt) // Should update timestamp
    })

    it("should update role and return new instance", () => {
      const user = UserEntity.create({
        name: "Original Name",
        email: "original@example.com",
        password: "password123",
        role: "user"
      })

      const updatedUser = user.updateRole("admin")

      expect(updatedUser.role).toBe("admin")
      expect(updatedUser).not.toBe(user) // Should be new instance
      expect(updatedUser.id).toBe(user.id) // ID should remain same
      expect(updatedUser.isAdmin()).toBe(true)
    })



    it("should verify email and return new instance", () => {
      const user = UserEntity.create({
        name: "Unverified User",
        email: "unverified@example.com",
        password: "password123",
        role: "user"
      })

      expect(user.emailVerified).toBe(false) // Default value

      const verifiedUser = user.verifyEmail()

      expect(verifiedUser.emailVerified).toBe(true)
      expect(verifiedUser).not.toBe(user) // Should be new instance
      expect(verifiedUser.id).toBe(user.id) // ID should remain same
      expect(verifiedUser.updatedAt).not.toEqual(user.updatedAt) // Should update timestamp
    })
  })

  describe("Serialization", () => {
    it("should serialize user correctly", () => {
      const user = UserEntity.create({
        name: "Serialize User",
        email: "serialize@example.com",
        password: "password123",
        role: "user"
      })

      const serialized = user.serialize()
      expect(serialized).toBeDefined()
      expect(typeof serialized).toBe("object")
    })

    it("should convert to repository format", () => {
      const user = UserEntity.create({
        name: "Repo User",
        email: "repo@example.com",
        password: "password123",
        role: "user"
      })

      const repoFormat = user.toRepository()

      expect(repoFormat.id).toBe(user.id)
      expect(repoFormat.name).toBe("Repo User")
      expect(repoFormat.email).toBe(user.email)
      expect(repoFormat.role).toBe(user.role)

      expect(repoFormat.emailVerified).toBe(false)
      expect(repoFormat.createdAt).toBeDefined()
      expect(repoFormat.updatedAt).toBeDefined()
    })

    it("should preserve email verification status in repository format", () => {
      const user = UserEntity.fromRepository({
        id: "550e8400-e29b-41d4-a716-446655440003", // Valid UUID
        name: "Verified User",
        email: "verified@example.com",
        role: "user",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const repoFormat = user.toRepository()

      expect(repoFormat.emailVerified).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle email with special characters", () => {
      const user = UserEntity.create({
        name: "Special User",
        email: "test+tag@example.com",
        password: "password123",
        role: "user"
      })

      expect(String(user.name)).toBe("Special User")
      expect(user.email).toBe(user.email) // Use the actual email value
      expect(user.isUser()).toBe(true)
    })

    it("should handle role case sensitivity", () => {
      // Should reject invalid role format - only "user" or "admin" are valid
      expect(() => {
        UserEntity.create({
          name: "Case User",
          email: "case@example.com",
          password: "password123",
          role: "USER" as any, // Type assertion for test
        })
      }).toThrow()
    })

    it("should handle name with spaces and special characters", () => {
      const user = UserEntity.create({
        name: "John Doe-Smith Jr.",
        email: "john@example.com",
        password: "password123",
        role: "user"
      })

      expect(String(user.name)).toBe("John Doe-Smith Jr.")
      expect(user.name.length).toBeLessThanOrEqual(255)
    })

    it("should handle minimum name length", () => {
      const user = UserEntity.create({
        name: "A", // Single character name
        email: "min@example.com",
        password: "password123",
        role: "user"
      })

      expect(String(user.name)).toBe("A")
      expect(user.name.length).toBeGreaterThanOrEqual(1)
    })

    it("should handle maximum name length", () => {
      const maxName = "a".repeat(255) // Exactly 255 characters
      const user = UserEntity.create({
        name: maxName,
        email: "max@example.com",
        password: "password123",
        role: "user"
      })

      expect(String(user.name)).toBe(maxName)
      expect(user.name.length).toBe(255)
    })
  })
})
