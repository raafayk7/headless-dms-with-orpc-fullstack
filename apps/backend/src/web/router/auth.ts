import { UserWorkflows } from "@application/workflows"
import { container } from "tsyringe"
import { publicRoutes as publicBase } from "../utils/orpc"
import { handleAppResult } from "../utils/result-handler"

const base = publicBase.auth

const loginHandler = base.login.handler(async ({ input }) => {
  const userWorkflows = container.resolve(UserWorkflows)
  const result = await userWorkflows.loginUser(input)

  if (result.isErr()) {
    return handleAppResult(result)
  }

  const user = result.unwrap()
  
  // TODO: Generate actual JWT token and expiration
  const token = "dummy-token"
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: new Date(user.createdAt.epochMillis).toISOString(),
      updatedAt: new Date(user.updatedAt.epochMillis).toISOString(),
    },
    expiresAt: expiresAt.toISOString(),
  }
})

const registerHandler = base.register.handler(async ({ input }) => {
  const userWorkflows = container.resolve(UserWorkflows)
  const result = await userWorkflows.registerUser(input)

  if (result.isErr()) {
    return handleAppResult(result)
  }

  const { user, message } = result.unwrap()
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: new Date(user.createdAt.epochMillis).toISOString(),
      updatedAt: new Date(user.updatedAt.epochMillis).toISOString(),
    },
    message,
  }
})

export default base.router({
  login: loginHandler,
  register: registerHandler,
})
