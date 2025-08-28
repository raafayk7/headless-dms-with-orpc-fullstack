import type { DateTimeEncoded, UUIDType } from "@domain/utils/refined-types"
import type { SQL } from "drizzle-orm"
import { timestamp, uuid } from "drizzle-orm/pg-core"

// simple branded type occurs only at the type level
export const getPrimaryKeyCol = <T extends UUIDType = UUIDType>() =>
  uuid("id").$type<T>().primaryKey().defaultRandom()

// export const dateTimeCol = customType<{
//   driverData: DateTimeEncoded
//   data: DateTimeType
// }>({
//   dataType() {
//     return "timestamp"
//   },
//   fromDriver(value) {
//     console.debug("Deserializing DateTime from driver:", value)
//     return DateTime.bridge.deserialize(value).unwrap()
//   },
//   toDriver(value) {
//     console.debug("Serializing DateTime to driver:", value)
//     return DateTime.bridge.serialize(value).unwrap()
//   },
// })

// export const dateTimeColWithDefault = (name: string) =>
//   dateTimeCol(name).$defaultFn(() => DateTime.now())

export const getBaseColumns = <T extends UUIDType = UUIDType>() => ({
  id: getPrimaryKeyCol<T>(),
  createdAt: timestamp("created_at")
    .$type<DateTimeEncoded>()
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .$type<DateTimeEncoded>()
    .notNull()
    .defaultNow(),
  // createdAt: dateTimeColWithDefault("created_at").notNull(),
  // updatedAt: dateTimeColWithDefault("updated_at").notNull(),
})

export type FilterMappers<F, C> = {
  [K in keyof F]?: (value: NonNullable<F[K]>) => C | undefined
}

export const buildFilterConditions = <
  // biome-ignore lint/suspicious/noExplicitAny: I'm tired
  F extends Record<string, any>,
  C extends SQL<unknown>,
>(
  filters: F,
  mappers: FilterMappers<F, C>,
): C[] => {
  const conditions: C[] = []

  for (const key of Object.keys(mappers) as (keyof F)[]) {
    const mapper = mappers[key]
    if (!mapper) continue
    const value = filters[key]
    if (value !== undefined && value !== null) {
      const condition = mapper(value as NonNullable<F[typeof key]>)
      if (condition !== undefined) {
        conditions.push(condition)
      }
    }
  }

  return conditions
}
