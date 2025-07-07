import type {
  DateTimeEncoded,
  DateTimeType,
  UUIDType,
} from "@domain/utils/refined-types"
import { DateTime } from "@domain/utils/refined-types"
import { customType, uuid } from "drizzle-orm/pg-core"

// simple branded type occurs only at the type level
export const getPrimaryKeyCol = <T extends UUIDType = UUIDType>() =>
  uuid("id").$type<T>().primaryKey().defaultRandom()

export const dateTimeCol = customType<{
  driverData: DateTimeEncoded
  data: DateTimeType
}>({
  dataType() {
    return "timestamp"
  },
  fromDriver(value) {
    return DateTime.bridge.deserialize(value).unwrap()
  },
  toDriver(value) {
    return DateTime.bridge.serialize(value).unwrap()
  },
})

export const dateTimeColWithDefault = (name: string) =>
  dateTimeCol(name).$defaultFn(() => DateTime.now())

export const getBaseColumns = <T extends UUIDType = UUIDType>() => ({
  id: getPrimaryKeyCol<T>(),
  createdAt: dateTimeColWithDefault("created_at").notNull(),
  updatedAt: dateTimeColWithDefault("updated_at").notNull(),
})
