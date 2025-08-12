#!/usr/bin/env bun

import "reflect-metadata"
import type { GroceryListType } from "@domain/grocery-list/grocery-list.entity"
import type { UserType } from "@domain/user/user.entity"
import { eq } from "drizzle-orm"
import { createDbInstance } from "@/infra/db/conn"
import {
  account,
  groceryListItems,
  groceryLists,
  user,
} from "@/infra/db/schema"

const db = createDbInstance()

// Seed user configuration - use environment variables for security
// Default values are provided for local development convenience
const SEED_USER = {
  email: process.env.SEED_USER_EMAIL || "test@dev.com",
  name: process.env.SEED_USER_NAME || "Test User",
  password: process.env.SEED_USER_PASSWORD || "testpass",
}

const SEED_LISTS = [
  {
    name: "Weekly Groceries",
    description: "Regular weekly shopping list",
    items: [
      {
        name: "Milk",
        quantity: 1,
        category: "Dairy",
        notes: "2% or whole milk",
      },
      {
        name: "Bread",
        quantity: 2,
        category: "Bakery",
        notes: "Whole wheat preferred",
      },
      { name: "Eggs", quantity: 12, category: "Dairy", notes: "Large size" },
      {
        name: "Bananas",
        quantity: 6,
        category: "Fruits",
        notes: "Not too ripe",
      },
      {
        name: "Chicken Breast",
        quantity: 2,
        category: "Meat",
        notes: "Boneless, skinless",
      },
      {
        name: "Rice",
        quantity: 1,
        category: "Grains",
        notes: "Basmati or jasmine",
      },
    ],
  },
  {
    name: "Party Supplies",
    description: "Items for weekend party",
    items: [
      {
        name: "Pizza",
        quantity: 3,
        category: "Frozen",
        notes: "Mixed varieties",
      },
      {
        name: "Soda",
        quantity: 6,
        category: "Beverages",
        notes: "Assorted flavors",
      },
      {
        name: "Ice Cream",
        quantity: 2,
        category: "Frozen",
        notes: "Vanilla and chocolate",
      },
      {
        name: "Chips",
        quantity: 4,
        category: "Snacks",
        notes: "Different flavors",
      },
      {
        name: "Napkins",
        quantity: 2,
        category: "Party Supplies",
        notes: "Paper napkins",
      },
    ],
  },
  {
    name: "Healthy Meal Prep",
    description: "Ingredients for meal prep this week",
    items: [
      {
        name: "Quinoa",
        quantity: 1,
        category: "Grains",
        notes: "Organic preferred",
      },
      {
        name: "Salmon Fillets",
        quantity: 4,
        category: "Fish",
        notes: "Fresh, not frozen",
      },
      {
        name: "Broccoli",
        quantity: 3,
        category: "Vegetables",
        notes: "Fresh heads",
      },
      {
        name: "Sweet Potatoes",
        quantity: 6,
        category: "Vegetables",
        notes: "Medium size",
      },
      {
        name: "Greek Yogurt",
        quantity: 2,
        category: "Dairy",
        notes: "Plain, unsweetened",
      },
      {
        name: "Avocados",
        quantity: 4,
        category: "Fruits",
        notes: "Ripe but firm",
      },
      {
        name: "Olive Oil",
        quantity: 1,
        category: "Condiments",
        notes: "Extra virgin",
      },
    ],
  },
]

async function seedDatabase() {
  console.log("🌱 Starting database seed...")

  try {
    // Check if user already exists
    const existingUser = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.email, SEED_USER.email))
      .limit(1)

    let userId: UserType["id"]

    if (existingUser.length > 0 && existingUser[0]) {
      console.log(
        `👤 User ${SEED_USER.email} already exists, using existing user`,
      )
      userId = existingUser[0].id as UserType["id"]
    } else {
      // Hash password
      const hashedPassword = await Bun.password.hash(SEED_USER.password, {
        algorithm: "argon2id",
      })

      // Create the test user
      console.log(`👤 Creating user: ${SEED_USER.email}`)
      const newUsers = await db
        .insert(user)
        .values({
          name: SEED_USER.name,
          email: SEED_USER.email,
          emailVerified: true,
          image: null,
        })
        .returning({ id: user.id })

      if (newUsers.length === 0 || !newUsers[0]) {
        throw new Error("Failed to create user")
      }
      userId = newUsers[0].id as UserType["id"]

      // Create account record with hashed password for email/password auth
      await db.insert(account).values({
        accountId: SEED_USER.email,
        providerId: "credential",
        userId: userId as UserType["id"],
        password: hashedPassword,
      })

      console.log(`✅ Created user and credentials for: ${SEED_USER.email}`)
    }

    // Check if lists already exist for this user
    const existingLists = await db
      .select({ id: groceryLists.id, name: groceryLists.name })
      .from(groceryLists)
      .where(eq(groceryLists.userId, userId as UserType["id"]))

    if (existingLists.length > 0) {
      console.log(
        `📝 User already has ${existingLists.length} grocery lists, skipping list creation`,
      )
    } else {
      // Create grocery lists and items
      console.log(`📝 Creating ${SEED_LISTS.length} grocery lists...`)

      for (const listData of SEED_LISTS) {
        const newLists = await db
          .insert(groceryLists)
          .values({
            name: listData.name,
            description: listData.description,
            userId: userId as UserType["id"],
            isActive: true,
          })
          .returning({ id: groceryLists.id })

        if (newLists.length === 0 || !newLists[0]) {
          throw new Error(`Failed to create list: ${listData.name}`)
        }

        const listId = newLists[0].id as GroceryListType["id"]
        console.log(`   📋 Created list: ${listData.name}`)

        // Add items to the list
        for (const item of listData.items) {
          await db.insert(groceryListItems).values({
            listId: listId as GroceryListType["id"],
            name: item.name,
            quantity: item.quantity,
            status: "pending",
            // category: item.category,
            notes: item.notes,
            createdBy: userId as UserType["id"],
          })
        }
        console.log(`      ✅ Added ${listData.items.length} items`)
      }
    }

    console.log("🎉 Database seeding completed successfully!")
    console.log("\n📋 Seed Summary:")
    console.log(`   👤 User: ${SEED_USER.email}`)
    console.log(`   🔑 Password: ${SEED_USER.password}`)
    console.log(`   📝 Created ${SEED_LISTS.length} grocery lists`)
    console.log(
      `   🛒 Total items: ${SEED_LISTS.reduce((sum, list) => sum + list.items.length, 0)}`,
    )
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seed function
if (import.meta.main) {
  await seedDatabase()
  process.exit(0)
}

export { seedDatabase }
