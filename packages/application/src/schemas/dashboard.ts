import { Schema as S } from "effect"

export const DashboardStatsSchema = S.Struct({
  totalLists: S.Number,
  recentLists: S.Number,
  completedToday: S.Number,
  pendingItems: S.Number,
})

export type DashboardStats = S.Schema.Type<typeof DashboardStatsSchema>
