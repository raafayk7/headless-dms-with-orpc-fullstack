import type { GroceryListEncoded } from "@domain/grocery-list/grocery-list.schemas"
import { Badge, Card, Group, Text } from "@mantine/core"
import { Clock } from "lucide-react"
import LinkBtn from "../layout/LinkBtn"

type ListCardProps = {
  list: GroceryListEncoded
}

export const ListCard = ({ list }: ListCardProps) => {
  return (
    <Card padding="md" radius="md" shadow="sm" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500} size="lg" truncate>
          {list.name}
        </Text>
        {list.active ? (
          <Badge color="blue" variant="light">
            Active
          </Badge>
        ) : (
          <Badge color="gray" variant="light">
            Inactive
          </Badge>
        )}
      </Group>

      <Text c="dimmed" lineClamp={2} mb="md" size="sm">
        {list.description || "No description"}
      </Text>

      <Group justify="space-between">
        <Group gap="xs">
          <Clock size={16} />
          <Text c="dimmed" size="xs">
            Updated {new Date(list.updatedAt).toLocaleDateString()}
          </Text>
        </Group>
        <Group gap="xs">
          <LinkBtn
            params={{ id: list.id }}
            preload="intent"
            size="xs"
            to="/lists/$id"
            variant="light"
          >
            View
          </LinkBtn>
        </Group>
      </Group>
    </Card>
  )
}
