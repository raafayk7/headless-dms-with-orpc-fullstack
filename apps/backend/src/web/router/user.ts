import { UserWorkflows } from "@application/workflows"
import { container } from "tsyringe"
import { authenticated } from "../utils/orpc"
import { handleAppResult } from "../utils/result-handler"
import { requireAdmin } from "../utils/rbac"

const base = authenticated.user

// Get current user (whoami)
const whoamiHandler = base.whoami.handler(async ({ context }) => {
  return context.user.serialize().unwrap()
})

// Get users with filtering and pagination (admin only)
const getUsersHandler = base.getUsers.handler(requireAdmin(async ({ input }) => {
  const userWorkflows = container.resolve(UserWorkflows)
  const result = await userWorkflows.getUsers(
    { data: input.query },
    { data: { page: input.query.page || 1, limit: input.query.limit || 10 } }
  )
  
  if (result.isErr()) {
    return handleAppResult(result)
  }
  
  const users = result.unwrap()
  const serializedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: new Date(user.createdAt.epochMillis).toISOString(),
    updatedAt: new Date(user.updatedAt.epochMillis).toISOString(),
  }))
  
  return {
    users: serializedUsers,
    pagination: {
      page: input.query.page || 1,
      limit: input.query.limit || 10,
      total: users.length,
      totalPages: Math.ceil(users.length / (input.query.limit || 10)),
    }
  }
}))

// Get user by ID (admin only)
const getUserByIdHandler = base.getUserById.handler(requireAdmin(async ({ input }) => {
  const userWorkflows = container.resolve(UserWorkflows)
  const result = await userWorkflows.getUserById(input.params.id)
  
  if (result.isErr()) {
    return handleAppResult(result)
  }
  
  const user = result.unwrap()
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: new Date(user.createdAt.epochMillis).toISOString(),
    updatedAt: new Date(user.updatedAt.epochMillis).toISOString(),
  }
}))

// Update user role (admin only)
const updateUserRoleHandler = base.updateUserRole.handler(requireAdmin(async ({ input }) => {
  const userWorkflows = container.resolve(UserWorkflows)
  const result = await userWorkflows.updateUserRole(input.params.id, { data: input.body })
  
  return handleAppResult(result)
}))

// Update user password (admin only)
const updateUserPasswordHandler = base.updateUserPassword.handler(requireAdmin(async ({ input }) => {
  const userWorkflows = container.resolve(UserWorkflows)
  const result = await userWorkflows.updateUserPassword(input.params.id, { data: input.body })
  
  return handleAppResult(result)
}))

// Delete user (admin only)
const deleteUserHandler = base.deleteUser.handler(requireAdmin(async ({ input }) => {
  const userWorkflows = container.resolve(UserWorkflows)
  const result = await userWorkflows.deleteUser(input.params.id)
  
  return handleAppResult(result)
}))

export default base.router({
  whoami: whoamiHandler,
  getUsers: getUsersHandler,
  getUserById: getUserByIdHandler,
  updateUserRole: updateUserRoleHandler,
  updateUserPassword: updateUserPasswordHandler,
  deleteUser: deleteUserHandler,
})
