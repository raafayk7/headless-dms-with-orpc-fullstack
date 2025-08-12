import { Center, Container } from "@mantine/core"
import { Outlet } from "@tanstack/react-router"

export const PublicPageLayout = () => {
  return (
    <Container h="100vh" size="xs">
      <Center h="100%">
        <Outlet />
      </Center>
    </Container>
  )
}
