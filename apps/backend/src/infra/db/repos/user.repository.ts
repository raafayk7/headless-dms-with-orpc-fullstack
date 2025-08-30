import { Result as R, type Result } from "@carbonteq/fp"
import type { UserEntity, UserType, UserUpdateType } from "@domain/user/user.entity"
import { UserEntity as User } from "@domain/user/user.entity"
import { UserNotFoundError, UserAlreadyExistsError } from "@domain/user/user.errors"
import { UserRepository, type UserFilterQuery } from "@domain/user/user.repository"
import { FpUtils, type RepoResult, type RepoUnitResult } from "@domain/utils"
import { and, eq, sql, asc, ilike } from "drizzle-orm"
import { injectable } from "tsyringe"
import type { AppDatabase } from "../conn"
import { InjectDb } from "../conn"
import { users } from "../schema"
import { enhanceEntityMapper } from "./repo.utils"

const mapper = enhanceEntityMapper((row: typeof users.$inferSelect) =>
  User.fromRepository({
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }),
)

@injectable()
export class DrizzleUserRepository extends UserRepository {
  constructor(@InjectDb() private readonly db: AppDatabase) {
    super()
  }

  async create(user: UserEntity): Promise<Result<UserEntity, UserAlreadyExistsError>> {
    try {
      // Check if user already exists
      const existing = await this.db.query.users.findFirst({
        where: eq(users.email, user.email),
      })

      if (existing) {
        return R.Err(new UserAlreadyExistsError(user.email))
      }

      const encoded = FpUtils.serialized(user)
      const res = await encoded
        .map(async (userData) => {
          const [newUser] = await this.db.insert(users).values({
            ...userData,
            id: user.id,
          }).returning()

          return user
        })
        .toPromise()

      return res
    } catch (error) {
      return R.Err(new UserAlreadyExistsError(user.email))
    }
  }

  async update(user: UserEntity): Promise<RepoResult<UserEntity, UserNotFoundError>> {
    try {
      const encoded = FpUtils.serialized(user)
      const res = await encoded
        .map(async (userData) => {
          const [updatedUser] = await this.db.update(users)
            .set({
              ...userData,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))
            .returning()

          if (!updatedUser) {
            return R.Err(new UserNotFoundError(user.id))
          }

          return user
        })
        .toPromise()

      return res
    } catch (error) {
      return R.Err(new UserNotFoundError(user.id))
    }
  }

  async delete(id: UserType["id"]): Promise<Result<void, UserNotFoundError>> {
    try {
      const result = await this.db.delete(users).where(eq(users.id, id))
      
      if ((result.rowCount ?? 0) === 0) {
        return R.Err(new UserNotFoundError(id))
      }

      return R.Ok(undefined)
    } catch (error) {
      return R.Err(new UserNotFoundError(id))
    }
  }

  async findById(id: UserType["id"]): Promise<RepoResult<UserEntity, UserNotFoundError>> {
    try {
      const row = await this.db.query.users.findFirst({
        where: eq(users.id, id),
      })

      if (!row) {
        return R.Err(new UserNotFoundError(id))
      }

      return mapper.mapOne(row)
    } catch (error) {
      return R.Err(new UserNotFoundError(id))
    }
  }

  async findByEmail(email: string): Promise<RepoResult<UserEntity, UserNotFoundError>> {
    try {
      const row = await this.db.query.users.findFirst({
        where: eq(users.email, email),
      })

      if (!row) {
        return R.Err(new UserNotFoundError(email))
      }

      return mapper.mapOne(row)
    } catch (error) {
      return R.Err(new UserNotFoundError(email))
    }
  }

  async find(query?: UserFilterQuery, pagination?: { page?: number; limit?: number }): Promise<Result<UserEntity[], Error>> {
    try {
      const conditions = this.buildQueryConditions(query)
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const countResult = await this.db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)
        .execute()
      const total = countResult[0]?.count || 0

      // Apply pagination
      const page = pagination?.page || 1
      const limit = pagination?.limit || 10
      const offset = (page - 1) * limit

      // Get paginated results
      const results = await this.db.select()
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(asc(users.createdAt))
        .execute()

      // Transform results to User entities
      const userResults = mapper.mapMany(results)
      
      if (userResults.isErr()) {
        return R.Err(new Error(`Failed to transform user records: ${userResults.unwrapErr().message}`))
      }

      return R.Ok(userResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find users: ${error}`))
    }
  }

  async findByRole(role: "user" | "admin"): Promise<Result<UserEntity[], Error>> {
    try {
      const results = await this.db.select()
        .from(users)
        .where(eq(users.role, role))
        .execute()

      const userResults = mapper.mapMany(results)
      
      if (userResults.isErr()) {
        return R.Err(new Error(`Failed to transform user records: ${userResults.unwrapErr().message}`))
      }

      return R.Ok(userResults.unwrap())
    } catch (error) {
      return R.Err(new Error(`Failed to find users by role: ${error}`))
    }
  }

  async exists(query: UserFilterQuery): Promise<Result<boolean, Error>> {
    try {
      const conditions = this.buildQueryConditions(query)
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const result = await this.db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)
        .execute()

      return R.Ok((result[0]?.count || 0) > 0)
    } catch (error) {
      return R.Err(new Error(`Failed to check user existence: ${error}`))
    }
  }

  async count(query?: UserFilterQuery): Promise<Result<number, Error>> {
    try {
      const conditions = this.buildQueryConditions(query)
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const result = await this.db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)
        .execute()

      return R.Ok(result[0]?.count || 0)
    } catch (error) {
      return R.Err(new Error(`Failed to count users: ${error}`))
    }
  }

  async updateUserFields(
    id: UserType["id"], 
    updates: UserUpdateType
  ): Promise<RepoResult<UserEntity, UserNotFoundError>> {
    try {
      const [updatedUser] = await this.db.update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning()

      if (!updatedUser) {
        return R.Err(new UserNotFoundError(id))
      }

      return mapper.mapOne(updatedUser)
    } catch (error) {
      return R.Err(new UserNotFoundError(id))
    }
  }

  async findByEmailAndPassword(
    email: string, 
    passwordHash: string
  ): Promise<RepoResult<UserEntity, UserNotFoundError>> {
    try {
      const row = await this.db.query.users.findFirst({
        where: and(
          eq(users.email, email),
          eq(users.passwordHash, passwordHash)
        ),
      })

      if (!row) {
        return R.Err(new UserNotFoundError(email))
      }

      return mapper.mapOne(row)
    } catch (error) {
      return R.Err(new UserNotFoundError(email))
    }
  }

  private buildQueryConditions(query?: UserFilterQuery) {
    const conditions = []
    
    if (query?.email) {
      conditions.push(ilike(users.email, `%${query.email}%`))
    }
    
    if (query?.role) {
      conditions.push(eq(users.role, query.role))
    }
    
    return conditions
  }
}
