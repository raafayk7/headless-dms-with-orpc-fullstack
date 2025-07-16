import type { CreateGroceryListDto } from "@application/dtos/grocery-list.dto"
import { ApplicationResult } from "@application/utils/application-result.utils"
import { Result } from "@carbonteq/fp"
import type { GroceryListType } from "@domain/grocery-list/grocery-list.entity"
import {
  type GroceryListFindFilters,
  GroceryListRepository,
} from "@domain/grocery-list/grocery-list.repository"
import type {
  GetListsParams,
  GetListsResult,
  GroceryListEncoded,
  NewGroceryListData,
} from "@domain/grocery-list/grocery-list.schemas"
import { GroceryListService } from "@domain/grocery-list/grocery-list.service"
import { ItemRepository } from "@domain/grocery-list-item/item.repository"
import type { UserEntity } from "@domain/user/user.entity"
import { ResultUtils } from "@domain/utils/fp-utils"
import { DateTime as DT } from "effect"
import { autoInjectable } from "tsyringe"
import type { DashboardStats } from "@application/schemas/dashboard"

const sevenDaysAgo = () => {
  const date = new Date()
  date.setDate(date.getDate() - 7)

  return date
}

@autoInjectable()
export class GroceryListWorkflows {
  constructor(
    private readonly groceryListRepo: GroceryListRepository,
    private readonly groceryItemsRepo: ItemRepository,
  ) {}

  async fetchGroceryListDetails(id: GroceryListType["id"], user: UserEntity) {
    const list = await this.groceryListRepo.findById(id)
    const listDetails = await list
      .flatZip((list) => this.groceryItemsRepo.findByList(list))
      .flatMap(([list, items]) =>
        GroceryListService.processListDetails(list, user, items),
      )
      .toPromise()

    return ApplicationResult.fromResult(listDetails)
  }

  async createGroceryList(dto: CreateGroceryListDto, user: UserEntity) {
    const { items, list } = GroceryListService.createNewList(dto.data, user)

    const listPersistResult = await this.groceryListRepo.create(list, items)

    const result = listPersistResult.flatMap((_) =>
      GroceryListService.processListDetails(list, user, items),
    )

    return ApplicationResult.fromResult(result)
  }

  async fetchGroceryListsForUser(user: UserEntity) {
    const lists = await this.groceryListRepo.findByUserId(user.id)
    const encoded = lists.flatMap((lists) => {
      const serialized = lists.map(ResultUtils.serialized)

      return ResultUtils.mapParseErrors(serialized)
    })

    return ApplicationResult.fromResult(encoded)
  }

  private async fetchWithFilters(filters: GroceryListFindFilters) {
    const lists = await this.groceryListRepo.findWithFilters(filters)
    const encoded = lists.flatMap(ResultUtils.paginatedSerialize)

    return ApplicationResult.fromResult(encoded)
  }

  async getGroceryListsWithFilters(
    user: UserEntity,
    filters: GetListsParams,
  ): Promise<ApplicationResult<GetListsResult>> {
    const since = filters.sinceMs
      ? new Date(
          DT.unsafeNow().pipe(DT.subtract({ millis: filters.sinceMs }))
            .epochMillis,
        )
      : undefined

    const repoFilters: GroceryListFindFilters = {
      userId: user.id,
      search: filters.search,
      status: filters.status,
      since,
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }

    return await this.fetchWithFilters(repoFilters)
  }

  async fetchRecentLists(user: UserEntity) {
    const since = sevenDaysAgo()
    return await this.fetchWithFilters({
      userId: user.id,
      since,
    })
  }

  async getDashboardStats(
    user: UserEntity,
  ): Promise<ApplicationResult<DashboardStats>> {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const recentSince = sevenDaysAgo()

    const [totalLists, recentLists, pendingItems, completedToday] =
      await Promise.all([
        this.groceryListRepo.count({ userId: user.id }),
        this.groceryListRepo.count({ userId: user.id, since: recentSince }),
        this.groceryItemsRepo.count({ userId: user.id, status: "pending" }),
        this.groceryItemsRepo.count({
          userId: user.id,
          status: "bought",
          updatedSince: startOfToday,
        }),
      ])

    const stats: DashboardStats = {
      totalLists,
      recentLists,
      pendingItems,
      completedToday,
    }

    return ApplicationResult.fromResult(Result.Ok(stats))
  }

  async updateGroceryList(
    _request: unknown, // UpdateGroceryListDto - not implemented yet
  ): Promise<ApplicationResult<unknown>> {
    return ApplicationResult.Err(new Error("Not implemented yet"))
  }

  async deleteGroceryList(_listId: string): Promise<ApplicationResult<void>> {
    return ApplicationResult.Err(new Error("Not implemented yet"))
  }
}
