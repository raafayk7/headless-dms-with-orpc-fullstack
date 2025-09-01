// import { GroceryListRepository } from "@domain/grocery-list/grocery-list.repository"
// import { ItemRepository } from "@domain/grocery-list-item/item.repository"
import { UserRepository } from "@domain/user/user.repository"
import { DocumentRepository } from "@domain/document/document.repository"
import { container } from "tsyringe"
import { asImplementation } from "@/infra/di/utils"
// import { DrizzleGroceryListRepository } from "./grocery-list.repository"
// import { DrizzleItemRepository } from "./item.repository"
import { DrizzleUserRepository } from "./user.repository"
import { DrizzleDocumentRepository } from "./document.repository"

export const registerRepositories = () => {
  // container.register(
  //   ...asImplementation(GroceryListRepository, DrizzleGroceryListRepository),
  // )
  // container.register(...asImplementation(ItemRepository, DrizzleItemRepository))
  container.register(...asImplementation(UserRepository, DrizzleUserRepository))
  container.register(...asImplementation(DocumentRepository, DrizzleDocumentRepository))
}
