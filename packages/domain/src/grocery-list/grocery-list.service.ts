import { Result } from "@carbonteq/fp"
import { ItemEntity } from "@domain/grocery-list-item/item.entity"
import { type UserEntity } from "@domain/user/user.entity"
import type { ValidationError } from "@domain/utils"
import { ResultUtils } from "@domain/utils/fp-utils"
import { GroceryListEntity } from "./grocery-list.entity"
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
      .flatMap((_) => ResultUtils.encoded(list))
      .flatZip((_) => ResultUtils.encoded(owner))
      .flatMap(([listEncoded, ownerEncoded]) => {
        const itemsSerialized = items.map(ResultUtils.serialized)
        const itemsEncoded = ResultUtils.mapParseErrors(itemsSerialized)

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

  // static validateBulkItemOperation(
  //   items: ItemEntity[],
  //   operation: "mark-complete" | "mark-pending" | "delete",
  //   userId: UserType["id"],
  // ): { valid: boolean; errors: string[] } {
  //   const errors: string[] = []
  //
  //   // Check if all items can be modified by the user
  //   const unauthorizedItems = items.filter(
  //     (item) => !item.canBeDeletedBy(userId),
  //   )
  //   if (unauthorizedItems.length > 0) {
  //     errors.push(
  //       `Cannot ${operation} ${unauthorizedItems.length} items: insufficient permissions`,
  //     )
  //   }
  //
  //   // Check operation-specific rules
  //   if (operation === "mark-complete") {
  //     const alreadyCompleted = items.filter((item) => item.isBought())
  //     if (alreadyCompleted.length === items.length) {
  //       errors.push("All items are already completed")
  //     }
  //   } else if (operation === "mark-pending") {
  //     const alreadyPending = items.filter((item) => item.isPending())
  //     if (alreadyPending.length === items.length) {
  //       errors.push("All items are already pending")
  //     }
  //   }
  //
  //   return {
  //     valid: errors.length === 0,
  //     errors,
  //   }
  // }
}
