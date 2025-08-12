import { Card, SimpleGrid, Skeleton, Stack } from "@mantine/core"

export const DashboardStatsSkeleton = () => {
  return (
    <Stack gap="md">
      <Skeleton height={32} width={200} />
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
        {Array.from({ length: 4 }, (_, index) => `stat-${index}`).map((key) => (
          <Card key={key} padding="lg" radius="md" shadow="sm" withBorder>
            <Stack gap="xs">
              <Skeleton height={14} width="60%" />
              <Skeleton height={28} width="40%" />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
