import { useDashboardStats } from "../../../shared/hooks/dashboard-hooks"
import { DashboardStats } from "./DashboardStats"

export const DashboardStatsContainer = () => {
  const { data: stats } = useDashboardStats()

  return <DashboardStats stats={stats} />
}
