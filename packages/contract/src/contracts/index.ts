import type { ContractRouterClient } from "@orpc/contract"
// import groceryListContract from "./grocery-list"
// import userContract from "./user-orpc"
import authContract from "./auth"
import documentContract from "./document"
import userContract from "./user"

export const CONTRACT = {
  public: {
    auth: authContract,
  },
  authenticated: {
    //user: userContract,
    user: userContract,
    // groceryList: groceryListContract,
    document: documentContract,
  },
}

export type AppRouterClient = ContractRouterClient<typeof CONTRACT>
