import type { GroceryListType } from "@domain/grocery-list/grocery-list.entity"
import type { ItemType } from "@domain/grocery-list-item/item.entity"
import type { UserType } from "@domain/user/user.entity"
import { relations } from "drizzle-orm"
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core"
import { getBaseColumns } from "../db.utils"
import { user } from "./auth.model"

type UserId = UserType["id"]
type GroceryListId = GroceryListType["id"]

export const groceryLists = pgTable("grocery_lists", {
  ...getBaseColumns<GroceryListId>(),

  name: text("name").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  userId: uuid("user_id")
    .$type<UserId>()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const pgItemStatusEnum = pgEnum("item_status", ["pending", "bought"])
export const groceryListItems = pgTable("grocery_list_items", {
  ...getBaseColumns<ItemType["id"]>(),

  listId: uuid("list_id")
    .$type<GroceryListId>()
    .notNull()
    .references(() => groceryLists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  status: pgItemStatusEnum("status").notNull().default("pending"),

  notes: text("notes"),
  createdBy: uuid("created_by")
    .$type<UserId>()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const groceryListsRelations = relations(
  groceryLists,
  ({ many, one }) => ({
    items: many(groceryListItems),
    user: one(user, {
      fields: [groceryLists.userId],
      references: [user.id],
    }),
  }),
)

export const groceryListItemsRelations = relations(
  groceryListItems,
  ({ one }) => ({
    list: one(groceryLists, {
      fields: [groceryListItems.listId],
      references: [groceryLists.id],
    }),
  }),
)

// export type GroceryList = typeof groceryLists.$inferSelect
// export type NewGroceryList = typeof groceryLists.$inferInsert
// export type GroceryListItem = typeof groceryListItems.$inferSelect
// export type NewGroceryListItem = typeof groceryListItems.$inferInsert
