import type { ContractRouterClient } from "@orpc/contract"
// import groceryListContract from "./grocery-list"
// import userContract from "./user-orpc"
import documentContract from "./document"
import userContract from "./user"

export const CONTRACT = {
  public: {
    // Auth is now handled directly by Better-Auth, not through oRPC contracts
  },
  authenticated: {
    //user: userContract,
    user: userContract,
    // groceryList: groceryListContract,
    document: documentContract,
  },
}

export type AppRouterClient = ContractRouterClient<typeof CONTRACT>
