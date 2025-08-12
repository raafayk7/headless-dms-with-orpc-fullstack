import { GroceryListRepository } from "@domain/grocery-list/grocery-list.repository"
import { ItemRepository } from "@domain/grocery-list-item/item.repository"
import { container } from "tsyringe"
import { asImplementation } from "@/infra/di/utils"
import { DrizzleGroceryListRepository } from "./grocery-list.repository"
import { DrizzleItemRepository } from "./item.repository"

export const registerRepositories = () => {
  container.register(
    ...asImplementation(GroceryListRepository, DrizzleGroceryListRepository),
  )
  container.register(...asImplementation(ItemRepository, DrizzleItemRepository))
}
