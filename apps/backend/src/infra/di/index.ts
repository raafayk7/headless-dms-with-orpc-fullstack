import { GroceryListWorkflows } from "@application/workflows"
import { container } from "tsyringe"
import { registerRepositories } from "../db/repos/di"
import { StorageService } from "../storage"

const services = [StorageService] as const
const workflows = [GroceryListWorkflows] as const

export const wireDi = () => {
  registerRepositories()

  // register application services
  for (const service of services) {
    container.registerSingleton(service, service)
  }

  for (const workflow of workflows) {
    container.registerSingleton(workflow, workflow)
  }
}
