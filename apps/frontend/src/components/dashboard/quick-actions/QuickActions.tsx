import LinkBtn from "@app/components/layout/LinkBtn"
import { Card, Group, Title } from "@mantine/core"
import { Plus } from "lucide-react"

export const QuickActions = () => {
  return (
    <Card padding="lg" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={4}>Quick Actions</Title>
      </Group>
      <Group>
        <LinkBtn
          leftSection={<Plus size={16} />}
          preload="intent"
          to="/lists/new"
          variant="light"
        >
          Create New List
        </LinkBtn>
        <LinkBtn
          leftSection={<Plus size={16} />}
          preload="intent"
          to="/lists"
          variant="light"
        >
          Browse All Lists
        </LinkBtn>
      </Group>
    </Card>
  )
}
