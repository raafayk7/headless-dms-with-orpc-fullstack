import { authenticated, publicRoutes as publicBase } from "../utils/orpc"
// import groceryListRouter from "./grocery-list"
// import userRouter from "./user-orpc"
import authRouter from "./auth"
import userRouter from "./user"
import documentRouter from "./document"

export const router = {
  public: publicBase.router({
    auth: authRouter,
  }),
  authenticated: authenticated.router({
    // user: userRouter, // Keep existing user-orpc for reference
    user: userRouter, // New user management routes
    // groceryList: groceryListRouter,
    document: documentRouter,
  }),
}

export type BackendRouter = typeof router
