import { useList } from "@app/shared/hooks/lists-hooks"
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { Link } from "@tanstack/react-router"
import { ArrowLeft, Edit, Eye, Trash2 } from "lucide-react"

type ListDetailsPageProps = {
  id: string
}

export const ListDetailsPage = ({ id }: ListDetailsPageProps) => {
  // const _navigate = useNavigate()
  // const _queryClient = useQueryClient()

  const { data: list } = useList(id)

  // const handleDelete = async () => {
  //   if (!confirm("Are you sure you want to delete this list?")) return
  //
  //   try {
  //     await orpc.authenticated.groceryList.deleteGroceryList({
  //       params: { id },
  //     })
  //
  //     const groceryListKey = orpc.authenticated.groceryList.getLists.key()
  //
  //     toast.success({ message: "List deleted successfully!" })
  //
  //     // Invalidate lists query to refresh the lists
  //     queryClient.invalidateQueries({
  //       queryKey: ["groceryList", "getLists"],
  //     })
  //
  //     // Navigate back to lists
  //     navigate({ to: "/lists" })
  //   } catch (error) {
  //     toast.error({
  //       message: "Failed to delete list",
  //       title: "Error",
  //     })
  //   }
  // }
  //
  // const handleToggleActive = async () => {
  //   try {
  //     await orpcClient.authenticated.groceryList.updateGroceryList({
  //       params: { id },
  //       body: { active: !list.active },
  //     })
  //
  //     toast.success({
  //       message: `List ${list.active ? "deactivated" : "activated"} successfully!`,
  //     })
  //
  //     // Invalidate the specific list query to refresh
  //     queryClient.invalidateQueries({
  //       queryKey: ["groceryList", "getListById", id],
  //     })
  //   } catch (error) {
  //     toast.error({
  //       message: "Failed to update list",
  //       title: "Error",
  //     })
  //   }
  // }

  if (!list) {
    return (
      <Container p="xl" pt="xl" size="md">
        <Stack align="center" gap="md">
          <Text c="dimmed" size="lg">
            List not found
          </Text>
          <Button component={Link} to="/lists" variant="subtle">
            Back to Lists
          </Button>
        </Stack>
      </Container>
    )
  }

  return (
    <Container p="xl" pt="xl" size="md">
      <Stack gap="lg">
        <Group>
          <Button
            component={Link}
            leftSection={<ArrowLeft size={16} />}
            to="/lists"
            variant="subtle"
          >
            Back to Lists
          </Button>
        </Group>

        <Card p="xl" radius="md" shadow="sm" withBorder>
          <Stack gap="lg">
            <Group justify="space-between">
              <div>
                <Title mb="xs" order={2}>
                  {list.name}
                </Title>
                <Group gap="xs">
                  <Text c="dimmed" size="sm">
                    Created{" "}
                    {new Date(String(list.createdAt)).toLocaleDateString()}
                  </Text>
                </Group>
              </div>
              <Group gap="xs">
                <Button
                  color={list.active ? "gray" : "blue"}
                  leftSection={<Eye size={16} />}
                  // onClick={handleToggleActive}
                  variant="light"
                >
                  {list.active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  color="yellow"
                  disabled
                  leftSection={<Edit size={16} />}
                  variant="light"
                >
                  Edit
                </Button>
                <Button
                  color="red"
                  leftSection={<Trash2 size={16} />}
                  // onClick={handleDelete}
                  variant="light"
                >
                  Delete
                </Button>
              </Group>
            </Group>

            {list.description && (
              <div>
                <Text fw={500} mb="xs">
                  Description
                </Text>
                <Text c="dimmed">{list.description}</Text>
              </div>
            )}

            <div>
              <Text fw={500} mb="xs">
                Details
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">
                    Last Updated:
                  </Text>
                  <Text size="sm">
                    {new Date(String(list.updatedAt)).toLocaleDateString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">
                    Status:
                  </Text>
                  <Badge
                    color={list.active ? "blue" : "gray"}
                    size="sm"
                    variant="light"
                  >
                    {list.active ? "Active" : "Inactive"}
                  </Badge>
                </Group>
              </Stack>
            </div>

            <Card bg="gray.0" p="md" radius="md" withBorder>
              <Text c="dimmed" size="sm" ta="center">
                List items functionality will be added here
              </Text>
            </Card>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
