import { Result as R } from "@carbonteq/fp"
import type { GroceryListType } from "@domain/grocery-list/grocery-list.entity"
import type {
  ItemEntity,
  ItemType,
} from "@domain/grocery-list-item/item.entity"
import { ItemEntity as Item } from "@domain/grocery-list-item/item.entity"
import { ItemNotFoundError } from "@domain/grocery-list-item/item.errors"
import {
  type GroceryItemFilters,
  ItemRepository,
} from "@domain/grocery-list-item/item.repository"
import { FpUtils, type RepoResult, ValidationError } from "@domain/utils"
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
    const encoded = FpUtils.serializedPreserveId(item)

    const res = await encoded
      .flatMap(async (itemData) => {
        const [inserted] = await this.db
          .insert(groceryListItems)
          .values({
            ...itemData,
            listId: item.listId,
            createdBy: item.createdBy,
          })
          .returning()

        if (!inserted) {
          return R.Err(new ValidationError("Failed to create item"))
        }

        return mapper.mapOne(inserted)
      })
      .toPromise()

    return res
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
    item: ItemEntity,
  ): Promise<RepoResult<ItemEntity, ItemNotFoundError>> {
    const res = await item
      .updateData()
      .flatMap(async (updateData) => {
        const [updated] = await this.db
          .update(groceryListItems)
          .set(updateData)
          .where(eq(groceryListItems.id, item.id))
          .returning()

        if (!updated) {
          return R.Err(new ItemNotFoundError(item.id))
        }

        return mapper.mapOne(updated)
      })
      .toPromise()

    return res
  }

  async delete(
    id: ItemType["id"],
  ): Promise<RepoResult<ItemEntity, ItemNotFoundError>> {
    const [result] = await this.db
      .delete(groceryListItems)
      .where(eq(groceryListItems.id, id))
      .returning()

    if (!result) {
      return R.Err(new ItemNotFoundError(id))
    }

    return mapper.mapOne(result)
  }

  async deleteByList(
    list: GroceryListType,
  ): Promise<RepoResult<ItemEntity["id"][]>> {
    const results = await this.db
      .delete(groceryListItems)
      .where(eq(groceryListItems.listId, list.id))
      .returning({ id: groceryListItems.id })

    return R.Ok(results.map((r) => r.id))
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
