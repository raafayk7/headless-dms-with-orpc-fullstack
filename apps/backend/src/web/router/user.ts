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
  
  // Handle optional query parameters
  const page = input.page || 1
  const limit = input.limit || 10
  const query = {
    email: input.email,
    role: input.role,
  }
  
  console.log("🔍 Router Debug - Input:", input)
  console.log("🔍 Router Debug - Processed query:", query)
  console.log("🔍 Router Debug - Page:", page, "Limit:", limit)
  
  const result = await userWorkflows.getUsers(
    { data: query },
    { data: { page, limit } }
  )
  
  if (result.isErr()) {
    console.error("🔍 Router Debug - Error:", result.unwrapErr())
    return handleAppResult(result)
  }
  
  const { users, total } = result.unwrap()
  console.log("🔍 Router Debug - Users count:", users.length, "Total:", total)
  
  const serializedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: new Date(user.createdAt.epochMillis).toISOString(),
    updatedAt: new Date(user.updatedAt.epochMillis).toISOString(),
  }))
  
  const response = {
    users: serializedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  }
  
  console.log("🔍 Router Debug - Response:", JSON.stringify(response, null, 2))
  return response
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
