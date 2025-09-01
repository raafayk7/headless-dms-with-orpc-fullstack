// import { GroceryListWorkflows, UserWorkflows, DocumentWorkflows } from "@application/workflows"
import { UserWorkflows, DocumentWorkflows } from "@application/workflows"
import { container } from "tsyringe"
import { registerRepositories } from "../db/repos/di"
import { StorageService } from "../storage"
import { JwtService } from "@application/services/jwt.service"

const services = [StorageService, JwtService] as const
const workflows = [UserWorkflows, DocumentWorkflows] as const

export const wireDi = () => {
  registerRepositories()

  // register application services
  container.registerSingleton(StorageService, StorageService)
  container.registerSingleton(JwtService, JwtService)

  // register workflows
  // container.registerSingleton(GroceryListWorkflows, GroceryListWorkflows)
  container.registerSingleton(UserWorkflows, UserWorkflows)
  container.registerSingleton(DocumentWorkflows, DocumentWorkflows)
}
