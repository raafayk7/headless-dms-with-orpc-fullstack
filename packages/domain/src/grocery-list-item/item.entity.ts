import type { Result } from "@carbonteq/fp"
import { Result as R } from "@carbonteq/fp"
import {
  GroceryListEntity,
  GroceryListId,
  type GroceryListType,
} from "@domain/grocery-list/grocery-list.entity"
import {
  UserEntity,
  UserIdSchema,
  type UserType,
} from "@domain/user/user.entity"
import { FpUtils } from "@domain/utils"
import { BaseEntity, defineEntityStruct } from "@domain/utils/base.entity"
import { Opt } from "@domain/utils/refined-types"
import { createEncoderDecoderBridge } from "@domain/utils/schema-utils"
import { Schema as S } from "effect"
import { ItemListMismatchError, ItemOwnershipError } from "./item.errors"

export const ItemStatusSchema = S.Literal("pending", "bought")

export const ItemSchema = defineEntityStruct("ItemId", {
  listId: GroceryListId,
  name: S.String.pipe(S.minLength(1)),
  quantity: S.Number.pipe(S.positive()),
  notes: Opt(S.String),
  status: ItemStatusSchema,
  createdBy: UserIdSchema,
})

export const ItemCreateSchema = ItemSchema.pipe(
  S.pick("name", "quantity", "notes"),
)
export type ItemCreateData = S.Schema.Type<typeof ItemCreateSchema>

export const ItemUpdateSchema = S.partial(
  ItemSchema.pipe(S.pick("name", "quantity", "status", "notes")),
)

export type ItemType = S.Schema.Type<typeof ItemSchema>
export type ItemEncoded = S.Schema.Encoded<typeof ItemSchema>
export type ItemStatus = S.Schema.Type<typeof ItemStatusSchema>

export type ItemUpdateData = S.Schema.Type<typeof ItemUpdateSchema>
export type ItemUpdateDataEncoded = S.Schema.Encoded<typeof ItemUpdateSchema>

const bridge = createEncoderDecoderBridge(ItemSchema)

export class ItemEntity extends BaseEntity implements ItemType {
  override readonly id: ItemType["id"]

  readonly listId: ItemType["listId"]
  readonly name: string
  readonly quantity: number
  readonly status: ItemStatus
  readonly createdBy: ItemType["createdBy"]
  readonly notes: ItemType["notes"]

  private constructor(data: ItemType) {
    super(data)
    this.id = data.id
    this.listId = data.listId
    this.name = data.name
    this.quantity = data.quantity
    this.status = data.status
    this.createdBy = data.createdBy
    this.notes = data.notes
  }

  static create(data: ItemCreateData, list: GroceryListType, owner: UserType) {
    return new ItemEntity({
      ...ItemSchema.baseInit(),
      ...data,
      listId: list.id,
      createdBy: owner.id,
      status: "pending",
    })
  }

  static from(data: ItemType): ItemEntity {
    return new ItemEntity(data)
  }

  static fromEncoded(data: ItemEncoded) {
    return bridge.deserialize(data).map((d) => new ItemEntity(d))
  }

  isPending(): boolean {
    return this.status === "pending"
  }

  isBought(): boolean {
    return this.status === "bought"
  }

  belongsToList(listId: GroceryListType["id"]): boolean {
    return this.listId === listId
  }

  isCreatedBy(userId: UserType["id"]): boolean {
    return this.createdBy === userId
  }

  ensureCanBeModifiedBy(
    list: GroceryListEntity,
    user: UserEntity,
  ): Result<this, ItemOwnershipError> {
    if (!this.isCreatedBy(user.id) && !list.isOwner(user.id)) {
      return R.Err(new ItemOwnershipError(this.id))
    }

    return R.Ok(this)
  }

  ensureBelongsToList(
    list: GroceryListEntity,
  ): Result<this, ItemListMismatchError> {
    if (!this.belongsToList(list.id)) {
      return R.Err(new ItemListMismatchError(this.id, list.id))
    }

    return R.Ok(this)
  }

  serialize() {
    return bridge.serialize(this)
  }

  updateData() {
    return this.serialize().map(
      // FpUtils.pick("name", "quantity", "notes", "status", "updatedAt"),
      FpUtils.omit("id", "createdAt", "createdBy", "listId"),
    )
  }
}
