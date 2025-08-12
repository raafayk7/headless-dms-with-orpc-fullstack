import { Button, Container, Stack, Text, Title } from "@mantine/core"
import { Link } from "@tanstack/react-router"
import { List } from "lucide-react"

export const RecentListsEmpty = () => {
  return (
    <Container py="xl" size="sm">
      <Stack align="center" gap="lg">
        <List color="var(--mantine-color-gray-5)" size={64} strokeWidth={1.5} />
        <Stack align="center" gap="xs">
          <Title order={4} ta="center">
            No recent lists yet
          </Title>
          <Text c="dimmed" ta="center">
            Create your first grocery list to get started with organizing your
            shopping.
          </Text>
        </Stack>
        <Button component={Link} size="md" to="/lists/new">
          Create Your First List
        </Button>
      </Stack>
    </Container>
  )
}
