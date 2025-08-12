import { DashboardPage } from "@app/pages/dashboard"
import {
  prefetchDashboardStats,
  prefetchRecentLists,
} from "@app/shared/hooks/dashboard-hooks"
import { createFileRoute } from "@tanstack/react-router"

const Home = () => {
  const { user } = Route.useRouteContext()

  return <DashboardPage user={user} />
}

export const Route = createFileRoute("/_private/")({
  component: Home,
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  loader: async ({ context }) => {
    const { queryClient, orpc } = context

    await Promise.all([
      prefetchRecentLists(queryClient, orpc),
      prefetchDashboardStats(queryClient, orpc),
    ])
  },
})
