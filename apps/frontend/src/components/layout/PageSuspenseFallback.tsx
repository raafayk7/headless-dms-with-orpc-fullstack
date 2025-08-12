import { Container, Flex, Loader } from "@mantine/core"

export const PageSuspenseFallback = () => (
  <Container h="100vh" p="xs" w="100%">
    <Flex align="center" justify="center">
      <Loader size="lg" />
    </Flex>
  </Container>
)
