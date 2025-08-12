import { Card, Group, SimpleGrid, Skeleton, Stack } from "@mantine/core"

export const RecentListsSkeleton = () => {
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Skeleton height={28} width={150} />
        <Skeleton height={32} width={100} />
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {Array.from({ length: 6 }, (_, index) => `list-${index}`).map((key) => (
          <Card key={key} padding="md" radius="md" shadow="sm" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Skeleton height={20} width="60%" />
                <Skeleton height={24} width={60} />
              </Group>
              <Skeleton height={16} width="80%" />
              <Skeleton height={16} width="40%" />
              <Group justify="space-between">
                <Skeleton height={14} width="50%" />
                <Skeleton height={14} width="30%" />
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
