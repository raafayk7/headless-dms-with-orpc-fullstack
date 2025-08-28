import { GroceryListWorkflows } from "@application/workflows"
import { container } from "tsyringe"
import { authenticated } from "../utils/orpc"
import { handleAppResult } from "../utils/result-handler"

const base = authenticated.groceryList

const getListByIdHandler = base.getListById.handler(
  async ({
    input: {
      params: { id },
    },
    context,
  }) => {
    const groceryListFlows = container.resolve(GroceryListWorkflows)
    const result = await groceryListFlows.fetchGroceryListDetails(
      id,
      context.user,
    )

    return handleAppResult(result)
  },
)

const getStatsHandler = base.getStats.handler(async ({ context }) => {
  const groceryListFlows = container.resolve(GroceryListWorkflows)
  const result = await groceryListFlows.getDashboardStats(context.user)

  return handleAppResult(result)
})

const createGroceryHandler = base.createGroceryList.handler(
  async ({ input: dto, context }) => {
    const groceryListFlows = container.resolve(GroceryListWorkflows)
    const result = await groceryListFlows.createGroceryList(dto, context.user)

    return handleAppResult(result)
  },
)

const updateGroceryHandler = base.updateGroceryList.handler(
  async ({ input: dto, context }) => {
    const groceryListFlows = container.resolve(GroceryListWorkflows)
    const result = await groceryListFlows.updateGroceryList(dto, context.user)

    return handleAppResult(result)
  },
)

const deleteGroceryHandler = base.deleteGroceryList.handler(
  async ({ input, context }) => {
    const groceryListFlows = container.resolve(GroceryListWorkflows)
    const result = await groceryListFlows.deleteGroceryList(
      input.params.id,
      context.user,
    )

    return handleAppResult(result)
  },
)

const getListsHandler = base.getLists.handler(
  async ({ context: { user }, input }) => {
    const groceryListFlows = container.resolve(GroceryListWorkflows)
    const result = await groceryListFlows.getGroceryListsWithFilters(
      user,
      input,
    )

    return handleAppResult(result)
  },
)

const getRecentListsHandler = base.fetchRecentLists.handler(
  async ({ context }) => {
    const groceryListFlows = container.resolve(GroceryListWorkflows)
    const result = await groceryListFlows.fetchRecentLists(context.user)

    return handleAppResult(result)
  },
)

export default base.router({
  getListById: getListByIdHandler,
  getStats: getStatsHandler,
  createGroceryList: createGroceryHandler,
  updateGroceryList: updateGroceryHandler,
  deleteGroceryList: deleteGroceryHandler,
  getLists: getListsHandler,
  fetchRecentLists: getRecentListsHandler,
})
