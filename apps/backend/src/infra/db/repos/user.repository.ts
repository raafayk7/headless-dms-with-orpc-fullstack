import { Result as R, type Result } from "@carbonteq/fp"
import type { UserEntity, UserType, UserUpdateType } from "@domain/user/user.entity"
import { UserEntity as User } from "@domain/user/user.entity"
import { UserNotFoundError, UserAlreadyExistsError, UserValidationError } from "@domain/user/user.errors"
import { UserRepository, type UserFilterQuery } from "@domain/user/user.repository"
import { FpUtils, type RepoResult, type RepoUnitResult } from "@domain/utils"
import { and, eq, sql, asc, ilike } from "drizzle-orm"
import { injectable } from "tsyringe"
import type { AppDatabase } from "../conn"
import { InjectDb } from "../conn"
import { users } from "../schema"
import { enhanceEntityMapper } from "./repo.utils"

const mapper = enhanceEntityMapper<typeof users.$inferSelect, UserEntity>((row: typeof users.$inferSelect) => {
  // Transform database types to domain types
  const transformedData = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
  
  try {
    const user = User.fromRepository(transformedData)
    return R.Ok(user)
  } catch (error) {
    return R.Err(new UserValidationError("Failed to create user entity from repository data"))
  }
})

@injectable()
export class DrizzleUserRepository extends UserRepository {
  constructor(@InjectDb() private readonly db: AppDatabase) {
    super()
  }

  async create(user: UserEntity): Promise<R<UserEntity, UserAlreadyExistsError>> {
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
            const { id, ...userDataWithoutId } = userData
            const [newUser] = await this.db.insert(users).values({
              ...userDataWithoutId,
           }).returning()

           return user
        })
        .mapErr(() => new UserAlreadyExistsError(user.email)) // Transform ValidationError to UserAlreadyExistsError
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
      .flatMap(async (userData) => {
        const { id, ...userDataWithoutId } = userData
        const [updatedUser] = await this.db.update(users)
          .set({
            ...userDataWithoutId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning()

        if (!updatedUser) {
          return R.Err(new UserNotFoundError(user.id))
        }

        return R.Ok(user)
      })
      .mapErr(() => new UserNotFoundError(user.id))
      .toPromise()

      return res
    } catch (error) {
      return R.Err(new UserNotFoundError(user.id))
    }
  }

  async delete(id: UserType["id"]): Promise<R<void, UserNotFoundError>> {
    try {
        const deletedUsers = await this.db.delete(users).where(eq(users.id, id)).returning()
      
        if (deletedUsers.length === 0) {
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

      const result = mapper.mapOne(row)
      if (result.isErr()) {
        return R.Err(new UserNotFoundError(id))
      }
      return R.Ok(result.unwrap())
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
        return R.Err(new UserValidationError("User not found"))
      }

      const result = mapper.mapOne(row)
      if (result.isErr()) {
        return R.Err(new UserValidationError("User not found"))
      }
      return R.Ok(result.unwrap())
    } catch (error) {
      return R.Err(new UserValidationError("User not found"))
    }
  }

  async find(query?: UserFilterQuery, pagination?: { page?: number; limit?: number }): Promise<R<{ users: UserEntity[]; total: number }, Error>> {
    try {
      console.log("🔍 Repository Debug - Query:", query)
      console.log("🔍 Repository Debug - Pagination:", pagination)
      
      const conditions = this.buildQueryConditions(query)
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined
      
      console.log("🔍 Repository Debug - Conditions:", conditions)
      console.log("🔍 Repository Debug - Where clause:", whereClause)

      // Get total count
      const countResult = await this.db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)
        .execute()
      const total = Number(countResult[0]?.count || 0)

      console.log("🔍 Repository Debug - Total count:", total, "Type:", typeof total)

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
        console.error("🔍 Repository Debug - Mapping error:", userResults.unwrapErr())
        return R.Err(new Error(`Failed to transform user records: ${userResults.unwrapErr().message}`))
      }

      const mappedUsers = userResults.unwrap()
      console.log("🔍 Repository Debug - Mapped users count:", mappedUsers.length)
      
      return R.Ok({ users: mappedUsers, total })
    } catch (error) {
      console.error("🔍 Repository Debug - Catch error:", error)
      return R.Err(new Error(`Failed to find users: ${error}`))
    }
  }

  async findByRole(role: "user" | "admin"): Promise<R<UserEntity[], Error>> {
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

  async exists(query: UserFilterQuery): Promise<R<boolean, Error>> {
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

  async count(query?: UserFilterQuery): Promise<R<number, Error>> {
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

      const result = mapper.mapOne(updatedUser)
      if (result.isErr()) {
        return R.Err(new UserNotFoundError(id))
      }
      return R.Ok(result.unwrap())
    } catch (error) {
      return R.Err(new UserNotFoundError(id))
    }
  }



  private buildQueryConditions(query?: UserFilterQuery) {
    const conditions = []
    
    console.log("🔍 BuildQueryConditions Debug - Input query:", query)
    
    if (query?.email) {
      console.log("🔍 BuildQueryConditions Debug - Adding email condition:", query.email)
      conditions.push(ilike(users.email, `%${query.email}%`))
    }
    
    if (query?.role) {
      console.log("🔍 BuildQueryConditions Debug - Adding role condition:", query.role)
      conditions.push(eq(users.role, query.role))
    }
    
    console.log("🔍 BuildQueryConditions Debug - Final conditions:", conditions)
    return conditions
  }
}
