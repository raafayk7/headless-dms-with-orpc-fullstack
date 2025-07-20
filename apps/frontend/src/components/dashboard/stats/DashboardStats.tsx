import type { DashboardStats as TDashboardStats } from "@application/schemas/dashboard"
import {
  ActionIcon,
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { Check, Clock, List, Plus } from "lucide-react"

type DashboardStatsProps = {
  stats: TDashboardStats
}

const StatCard = ({
  title,
  value,
  icon,
  color = "blue",
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string
}) => {
  return (
    <Card padding="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between">
        <Box>
          <Text c="dimmed" fw={700} size="sm" tt="uppercase">
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </Box>
        <ActionIcon color={color} radius="md" size="xl" variant="light">
          {icon}
        </ActionIcon>
      </Group>
    </Card>
  )
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <Stack gap="md">
      <Title order={3}>Your Stats</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
        <StatCard
          color="blue"
          icon={<List size={24} />}
          title="Total Lists"
          value={stats.totalLists}
        />
        <StatCard
          color="green"
          icon={<Clock size={24} />}
          title="Recent Lists"
          value={stats.recentLists}
        />
        <StatCard
          color="orange"
          icon={<Plus size={24} />}
          title="Pending Items"
          value={stats.pendingItems}
        />
        <StatCard
          color="teal"
          icon={<Check size={24} />}
          title="Completed Today"
          value={stats.completedToday}
        />
      </SimpleGrid>
    </Stack>
  )
}
