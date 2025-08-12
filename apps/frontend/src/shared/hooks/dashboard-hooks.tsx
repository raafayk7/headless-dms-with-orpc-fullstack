import { QueryClient, useSuspenseQuery } from "@tanstack/react-query"
import type { OrpcReactQuery } from "../orpc"
import { orpc } from "../orpc"

const dashboardStatsQueryOptions = (orpc: OrpcReactQuery) => {
  return orpc.authenticated.groceryList.getStats.queryOptions({
    retry: 2,
  })
}

const recentListsQueryOptions = (orpc: OrpcReactQuery) => {
  return orpc.authenticated.groceryList.fetchRecentLists.queryOptions({
    select: (data) => data.items,
    retry: 2,
  })
}

export const useDashboardStats = () =>
  useSuspenseQuery(dashboardStatsQueryOptions(orpc))

export const useRecentLists = () =>
  useSuspenseQuery(recentListsQueryOptions(orpc))

export const prefetchDashboardStats = (
  queryClient: QueryClient,
  orpc: OrpcReactQuery,
) => queryClient.ensureQueryData(dashboardStatsQueryOptions(orpc))

export const prefetchRecentLists = (
  queryClient: QueryClient,
  orpc: OrpcReactQuery,
) => queryClient.ensureQueryData(recentListsQueryOptions(orpc))
