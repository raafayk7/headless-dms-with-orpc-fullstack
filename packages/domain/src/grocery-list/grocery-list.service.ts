import { Result } from "@carbonteq/fp"
import { ItemEntity } from "@domain/grocery-list-item/item.entity"
import { type UserEntity } from "@domain/user/user.entity"
import type { ValidationError } from "@domain/utils"
import { ResultUtils } from "@domain/utils/fp-utils"
import {
  GroceryListEntity,
  type GroceryListUpdateData,
} from "./grocery-list.entity"
import type { GroceryListOwnershipError } from "./grocery-list.errors"
import type {
  GroceryListDetails,
  NewGroceryListData,
} from "./grocery-list.schemas"

type GroceryListStats = GroceryListDetails["stats"]

export class GroceryListService {
  static calculateDetailedStats(items: ItemEntity[]): GroceryListStats {
    const totalItems = items.length
    const pendingItems = items.filter((item) => item.isPending()).length
    const completedItems = items.filter((item) => item.isBought()).length

    const completionPercentage =
      totalItems > 0 ? (completedItems / totalItems) * 100 : 0

    return {
      totalItems,
      pendingItems,
      completedItems,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
    }
  }

  static processListDetails(
    list: GroceryListEntity,
    owner: UserEntity,
    items: ItemEntity[],
  ): Result<GroceryListDetails, GroceryListOwnershipError | ValidationError> {
    const encoded = list
      .ensureIsOwner(owner)
      .flatMap((_) => ResultUtils.serialized(list))
      .flatZip((_) => ResultUtils.serialized(owner))
      .flatMap(([listEncoded, ownerEncoded]) => {
        const itemsSerialized = items.map(ResultUtils.serialized)
        const itemsEncoded =
          ResultUtils.collectValidationErrors(itemsSerialized)

        return itemsEncoded.map((it) => ({
          itemsEncoded: it,
          listEncoded,
          ownerEncoded,
        }))
      })
      .map(({ itemsEncoded, listEncoded, ownerEncoded }) => {
        const stats = GroceryListService.calculateDetailedStats(items)

        return {
          ...listEncoded,
          items: itemsEncoded,
          owner: ownerEncoded,
          stats,
        } satisfies GroceryListDetails
      })

    return encoded
  }

  static calculateCompletionStatus(
    items: ItemEntity[],
  ):
    | "empty"
    | "just-started"
    | "in-progress"
    | "nearly-complete"
    | "completed" {
    if (items.length === 0) {
      return "empty"
    }

    const completedItems = items.filter((item) => item.isBought()).length
    const completionRatio = completedItems / items.length

    if (completionRatio === 0) {
      return "just-started"
    } else if (completionRatio === 1) {
      return "completed"
    } else if (completionRatio >= 0.8) {
      return "nearly-complete"
    } else {
      return "in-progress"
    }
  }

  static createNewList(data: NewGroceryListData, owner: UserEntity) {
    const list = GroceryListEntity.create(data, owner)
    const items = data.items.map((itemData) =>
      ItemEntity.create(itemData, list, owner),
    )

    return { list, items }
  }

  static updateGroceryList(
    list: GroceryListEntity,
    updateData: GroceryListUpdateData,
    user: UserEntity,
  ): Result<GroceryListEntity, GroceryListOwnershipError | ValidationError> {
    return list
      .ensureIsOwner(user)
      .flatMap(ResultUtils.serialized)
      .flatMap((serializedList) => {
        const updatedData = {
          ...serializedList,
          ...updateData,
          updatedAt: new Date(),
        }

        return GroceryListEntity.fromEncoded(updatedData)
      })
  }
}
