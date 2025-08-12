import {
  DashboardStatsContainer,
  QuickActions,
  RecentListsContainer,
} from "@app/components/dashboard"
import type { AppSession } from "@app/shared/auth-client"
import { Container, Stack, Title } from "@mantine/core"

type DashboardPageProps = {
  user: AppSession["user"]
}

export const DashboardPage = ({ user }: DashboardPageProps) => {
  return (
    <Container fluid p="xl" pt="xl">
      <Stack gap="2rem">
        <Title order={2}>Welcome back, {user.name}! 👋</Title>
        <QuickActions />
        <DashboardStatsContainer />
        <RecentListsContainer />
      </Stack>
    </Container>
  )
}
