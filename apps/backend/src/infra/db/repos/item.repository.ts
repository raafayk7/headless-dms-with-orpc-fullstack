import { Result as R } from "@carbonteq/fp"
import type { GroceryListType } from "@domain/grocery-list/grocery-list.entity"
import type {
  ItemEntity,
  ItemType,
  ItemUpdateDataEncoded,
} from "@domain/grocery-list-item/item.entity"
import { ItemEntity as Item } from "@domain/grocery-list-item/item.entity"
import {
  ItemNotFoundError,
  ItemValidationError,
} from "@domain/grocery-list-item/item.errors"
import {
  type GroceryItemFilters,
  ItemRepository,
} from "@domain/grocery-list-item/item.repository"
import type { RepoResult, RepoUnitResult } from "@domain/utils"
import { DateTime } from "@domain/utils/refined-types"
import { parseErrorToValidationError } from "@domain/utils/valididation.utils"
import { and, eq, gte } from "drizzle-orm"
import { injectable } from "tsyringe"
import type { AppDatabase } from "../conn"
import { InjectDb } from "../conn"
import { groceryListItems } from "../schema"
import { enhanceEntityMapper } from "./repo.utils"

const mapper = enhanceEntityMapper(
  (row: typeof groceryListItems.$inferSelect) =>
    Item.fromEncoded({
      id: row.id,
      listId: row.listId,
      name: row.name,
      quantity: row.quantity,
      status: row.status,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      notes: row.notes,
    }),
)

@injectable()
export class DrizzleItemRepository extends ItemRepository {
  constructor(@InjectDb() private readonly db: AppDatabase) {
    super()
  }

  async create(item: ItemEntity): Promise<RepoResult<ItemEntity>> {
    const encoded = item.serialize()

    if (encoded.isErr()) {
      return encoded.mapErr(parseErrorToValidationError)
    }
    const data = encoded.unwrap()

    const values = {
      id: item.id,
      listId: item.listId,
      status: data.status,
      name: data.name,
      quantity: data.quantity,
      createdBy: item.createdBy,
    } satisfies typeof groceryListItems.$inferInsert

    const [inserted] = await this.db
      .insert(groceryListItems)
      .values(values)
      .returning()

    if (!inserted) {
      return R.Err(new ItemValidationError("Failed to create item"))
    }

    return mapper.mapOne(inserted)
  }

  async findById(
    id: ItemType["id"],
  ): Promise<RepoResult<ItemEntity, ItemNotFoundError>> {
    const result = await this.db.query.groceryListItems.findFirst({
      where: eq(groceryListItems.id, id),
    })

    if (!result) {
      return R.Err(new ItemNotFoundError(id))
    }

    return mapper.mapOne(result)
  }

  async findByList(list: GroceryListType): Promise<RepoResult<ItemEntity[]>> {
    const results = await this.db
      .select()
      .from(groceryListItems)
      .where(eq(groceryListItems.listId, list.id))

    const items = mapper.mapMany(results)

    return items
  }

  async update(
    id: ItemType["id"],
    updates: ItemUpdateDataEncoded,
  ): Promise<RepoResult<ItemEntity, ItemNotFoundError>> {
    const updateData: Partial<typeof groceryListItems.$inferInsert> = {
      updatedAt: DateTime.now(),
    }

    if (updates.name !== undefined) {
      updateData.name = updates.name
    }
    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status
    }

    const [updated] = await this.db
      .update(groceryListItems)
      .set(updateData)
      .where(eq(groceryListItems.id, id))
      .returning()

    if (!updated) {
      return R.Err(new ItemNotFoundError(id))
    }

    return mapper.mapOne(updated)
  }

  async delete(id: ItemType["id"]): Promise<RepoUnitResult<ItemNotFoundError>> {
    const result = await this.db
      .delete(groceryListItems)
      .where(eq(groceryListItems.id, id))
      .returning({ id: groceryListItems.id })

    if (result.length === 0) {
      return R.Err(new ItemNotFoundError(id))
    }

    return R.UNIT_RESULT
  }

  async deleteByList(list: GroceryListType): Promise<RepoUnitResult> {
    await this.db
      .delete(groceryListItems)
      .where(eq(groceryListItems.listId, list.id))

    return R.UNIT_RESULT
  }

  async count(filters: GroceryItemFilters): Promise<number> {
    const conditions = []

    if (filters.listId) {
      conditions.push(eq(groceryListItems.listId, filters.listId))
    }
    if (filters.userId) {
      conditions.push(eq(groceryListItems.createdBy, filters.userId))
    }
    if (filters.status) {
      conditions.push(eq(groceryListItems.status, filters.status))
    }
    if (filters.updatedSince) {
      conditions.push(gte(groceryListItems.updatedAt, filters.updatedSince))
    }

    const c = await this.db.$count(
      groceryListItems,
      conditions.length > 0 ? and(...conditions) : undefined,
    )

    return c
  }
}
