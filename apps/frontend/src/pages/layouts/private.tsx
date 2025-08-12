import LogoutBtn from "@app/components/auth/LogoutBtn"
import NavigationLink from "@app/components/layout/NavigationLink"
import { AppShell, Box, Group, Stack, Text } from "@mantine/core"
import { Outlet } from "@tanstack/react-router"
import { Home, List, Plus, User, UserPlus } from "lucide-react"

export function PrivatePageLayout() {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm" }}>
      <AppShell.Header p="md">
        <Group align="center" justify="center">
          <Text c="blue" fw="bold" size="lg">
            Grocery Tracker
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack dir="column" gap="md" style={{ height: "100%" }}>
          <Box style={{ flex: 1 }}>
            <Stack gap="xs">
              <Text c="dimmed" fw="bold" mb="xs" size="xs" tt="uppercase">
                Navigation
              </Text>

              <NavigationLink
                label="Dashboard"
                leftSection={<Home size={16} />}
                to="/"
              />
              <NavigationLink
                label="All Lists"
                leftSection={<List size={16} />}
                to="/lists"
              />
              <NavigationLink
                label="Create List"
                leftSection={<Plus size={16} />}
                to="/lists/new"
              />

              <Text
                c="dimmed"
                fw="bold"
                mb="xs"
                mt="md"
                size="xs"
                tt="uppercase"
              >
                To Add
              </Text>
              <NavigationLink
                disabled
                label="List Collaborators"
                leftSection={<UserPlus size={16} />}
                to="/collaborators"
              />
              <NavigationLink
                disabled
                label="Profile"
                leftSection={<User size={16} />}
                to="/profile"
              />
            </Stack>
          </Box>

          <Box
            mt="auto"
            pt="md"
            style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}
          >
            <LogoutBtn />
          </Box>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
