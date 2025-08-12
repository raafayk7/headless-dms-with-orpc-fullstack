import { Schema as S } from "effect"
import { DateTime, UUID } from "./refined-types"
import { addMethodsToSchema } from "./schema-utils"

export const baseEntityFields = {
  id: UUID,
  createdAt: DateTime,
  updatedAt: DateTime,
} as const satisfies S.Struct.Fields
export type TBaseEntityFields = typeof baseEntityFields

const baseEntityStruct = S.mutable(S.Struct(baseEntityFields))

export const defineEntityStruct = <
  Tag extends string,
  Fields extends S.Struct.Fields,
>(
  tag: Tag,
  fields: Fields,
) => {
  const id = baseEntityFields.id.extend(tag)

  const struct = S.Struct({
    ...baseEntityFields,
    id,
    ...fields,
  })
  const extendedStruct = addMethodsToSchema(struct, {
    baseInit: () => ({
      id: id.new(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    }),
    id,
  })

  return extendedStruct
}

export type BaseEntityEncoded = S.Schema.Encoded<typeof baseEntityStruct>
export type BaseEntityType = S.Schema.Type<typeof baseEntityStruct>

export class BaseEntity implements BaseEntityType {
  readonly id: BaseEntityType["id"]
  readonly createdAt: BaseEntityType["createdAt"]
  readonly updatedAt: BaseEntityType["updatedAt"]

  protected constructor(data: BaseEntityType) {
    this.id = data.id
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}
