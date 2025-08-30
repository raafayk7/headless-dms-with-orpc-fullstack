// ORIGINAL BETTER AUTH MODELS (COMMENTED FOR REFERENCE)
// import type { UserType } from "@domain/user/user.entity"
// import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
// import { getBaseColumns, getPrimaryKeyCol } from "../db.utils"

// type UserId = UserType["id"]

// export const user = pgTable("user", {
//   ...getBaseColumns<UserId>(),

//   name: text("name").notNull(),
//   email: text("email").notNull().unique(),
//   emailVerified: boolean("email_verified").notNull(),
//   image: text("image"),
// })

// export const session = pgTable("session", {
//   ...getBaseColumns(),

//   expiresAt: timestamp("expires_at").notNull(),
//   token: text("token").notNull().unique(),
//   ipAddress: text("ip_address"),
//   userAgent: text("user_agent"),
//   userId: uuid("user_id")
//     .$type<UserId>()
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),
// })

// export const account = pgTable("account", {
//   ...getBaseColumns(),

//   accountId: text("account_id").notNull(),
//   providerId: text("provider_id").notNull(),
//   userId: uuid("user_id")
//     .$type<UserId>()
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),
//   accessToken: text("access_token"),
//   refreshToken: text("refresh_token"),
//   idToken: text("id_token"),
//   accessTokenExpiresAt: timestamp("access_token_expires_at"),
//   refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
//   scope: text("scope"),
//   password: text("password"),
// })

// export const verification = pgTable("verification", {
//   id: getPrimaryKeyCol(),
//   identifier: text("identifier").notNull(),
//   value: text("value").notNull(),
//   expiresAt: timestamp("expires_at").notNull(),
//   createdAt: timestamp("created_at"),
//   updatedAt: timestamp("updated_at"),
// })

// NEW DMS TABLES
import type { UserType } from "@domain/user/user.entity"
import type { DocumentType } from "@domain/document/document.entity"
import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { getBaseColumns, getPrimaryKeyCol } from "../db.utils"

type UserId = UserType["id"]
type DocumentId = DocumentType["id"]

// DMS User table
export const users = pgTable("users", {
  ...getBaseColumns<UserId>(),
  
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
})

// DMS Document table
export const documents = pgTable("documents", {
  ...getBaseColumns<DocumentId>(),
  
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // Using integer for file size in bytes
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
  userId: uuid("user_id")
    .$type<UserId>()
    .references(() => users.id, { onDelete: "cascade" }),
})
