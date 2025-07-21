import type { UnitResult } from "@carbonteq/fp"
import { Result as R } from "@carbonteq/fp"
import {
  GroceryListId,
  type GroceryListType,
} from "@domain/grocery-list/grocery-list.entity"
import { InviteExpiredError } from "@domain/invite/invite.errors"
import { BaseEntity, defineEntityStruct } from "@domain/utils/base.entity"
import { DateTime, UUID } from "@domain/utils/refined-types"
import { createEncoderDecoderBridge } from "@domain/utils/schema-utils"
import { DateTime as DT, Schema as S } from "effect"

export const InviteRoleSchema = S.Literal("editor")
const InviteId = UUID.pipe(S.brand("InviteId"))

export const InviteSchema = defineEntityStruct("InviteId", {
  id: InviteId,
  listId: GroceryListId,
  token: S.String.pipe(S.minLength(1)),
  role: InviteRoleSchema,
  expiresAt: DateTime,
})

export type InviteType = S.Schema.Type<typeof InviteSchema>
export type InviteEncoded = S.Schema.Encoded<typeof InviteSchema>
export type InviteRole = S.Schema.Type<typeof InviteRoleSchema>

const bridge = createEncoderDecoderBridge(InviteSchema)

export class InviteEntity extends BaseEntity implements InviteType {
  override readonly id: InviteType["id"]

  readonly listId: InviteType["listId"]
  readonly token: InviteType["token"]
  readonly role: InviteRole
  readonly expiresAt: InviteType["expiresAt"]

  private constructor(data: InviteType) {
    super(data)
    this.id = data.id
    this.listId = data.listId
    this.token = data.token
    this.role = data.role
    this.expiresAt = data.expiresAt
  }

  static generateInvite(list: GroceryListType): InviteEntity {
    return new InviteEntity({
      ...InviteSchema.baseInit(),
      role: InviteEntity.getDefaultRole(),
      listId: list.id,
      expiresAt: InviteEntity.calculateExpirationDate(),
      token: crypto.randomUUID(),
    })
  }

  static from(data: InviteType): InviteEntity {
    return new InviteEntity(data)
  }

  static fromEncoded(data: InviteEncoded) {
    return bridge.deserialize(data)
  }

  isValid(): boolean {
    return !this.isExpired()
  }

  isExpired(): boolean {
    return DT.unsafeIsPast(this.expiresAt)
  }

  belongsToList(listId: GroceryListType["id"]): boolean {
    return this.listId === listId
  }

  serialize() {
    return bridge.serialize({
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      listId: this.listId,
      token: this.token,
      role: this.role,
      expiresAt: this.expiresAt,
    })
  }

  ensureIsValid(): UnitResult<InviteExpiredError> {
    if (this.isExpired()) {
      return R.Err(new InviteExpiredError())
    }

    return R.UNIT_RESULT
  }

  // static validateTokenFormat(
  //   token: string,
  // ): Result<void, InvalidInviteTokenError> {
  //   const tokenRegex = /^[A-Za-z0-9]{32}$/
  //   if (!tokenRegex.test(token)) {
  //     return R.Err(new InvalidInviteTokenError())
  //   }
  //   return R.Ok(undefined)
  // }

  static calculateExpirationDate(daysFromNow = 7): DT.Utc {
    return DT.unsafeNow().pipe(DT.add({ days: daysFromNow }))
  }

  static getDefaultRole(): InviteRole {
    return "editor"
  }
}
