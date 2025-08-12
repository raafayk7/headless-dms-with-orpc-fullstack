import { ListCard } from "@app/components/shared/ListCard"
import { useLists } from "@app/shared/hooks/lists-hooks"
import {
  Button,
  Container,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import { Plus, Search } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export const GroceryListsListPage = () => {
  const navigate = useNavigate({ from: "/lists" })
  const searchParams = useSearch({ from: "/_private/lists/" })

  const [search, setSearch] = useState(searchParams.search)
  const [debouncedSearch] = useDebouncedValue(search, 300)

  // syncing debounced search value with searchParams
  // searchParams -> local search
  useEffect(() => {
    setSearch(searchParams.search)
  }, [searchParams.search])

  // local search -> searchParams
  useEffect(() => {
    if (debouncedSearch !== searchParams.search) {
      navigate({
        search: (prev) => ({ ...prev, page: 1, search: debouncedSearch }),
        replace: true, // avoid cluttering browser history
      })
    }
  }, [debouncedSearch, searchParams.search, navigate])

  const { data, isLoading } = useLists({
    ...searchParams,
    status: searchParams.status || undefined,
  })

  const handleStatusChange = useCallback(
    (value: string | null) => {
      const status = (value || "") as "active" | "inactive" | ""
      navigate({
        search: (prev) => ({
          ...prev,
          status,
        }),
      })
    },
    [navigate],
  )

  const lists = data.items

  return (
    <Container fluid p="xl" pt="xl">
      <Stack gap="2rem">
        <Group justify="space-between">
          <Title order={2}>All Grocery Lists</Title>
          <Button
            component={Link}
            leftSection={<Plus size={16} />}
            to="/lists/new"
          >
            Create New List
          </Button>
        </Group>

        <Group gap="md">
          <TextInput
            disabled={isLoading}
            enterKeyHint="search"
            inputMode="search"
            leftSection={<Search size={16} />}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search lists..."
            style={{ flex: 1, maxWidth: 300 }}
            value={search}
          />
          <Select
            clearable
            data={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            disabled={isLoading}
            onChange={handleStatusChange}
            placeholder="Filter by status"
            style={{ minWidth: 150 }}
            value={searchParams.status}
          />
        </Group>

        {lists.length === 0 ? (
          <Stack align="center" gap="md" p="xl">
            <Text c="dimmed" size="lg" ta="center">
              {searchParams.search || searchParams.status
                ? "No lists match your filters"
                : "No grocery lists found"}
            </Text>
            <Text c="dimmed" ta="center">
              {searchParams.search || searchParams.status
                ? "Try adjusting your search or filters"
                : "Create your first grocery list to get started"}
            </Text>
            {!searchParams.search && !searchParams.status && (
              <Button
                component={Link}
                leftSection={<Plus size={16} />}
                to="/lists/new"
              >
                Create Your First List
              </Button>
            )}
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  )
}
