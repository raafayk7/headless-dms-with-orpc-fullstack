import { useAppForm } from "@app/shared/hooks/app-form"
import { orpc } from "@app/shared/orpc"
import { toast } from "@app/shared/toast"
import {
  Button,
  Card,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { type } from "arktype"
import { ArrowLeft } from "lucide-react"

const formSchema = type({
  name: "string>=1",
  description: "string",
  items: type({}).array(),
})

export const NewListPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useAppForm({
    defaultValues: { name: "", description: "", items: [] },
    validators: { onSubmit: formSchema },

    onSubmit: async ({ value }) => {
      try {
        const res = await orpc.authenticated.groceryList.createGroceryList.call(
          {
            name: value.name,
            description: value.description,
          },
        )

        toast.success({ message: "List created successfully!" })

        queryClient.invalidateQueries({
          queryKey: ["groceryList", "getLists"],
        })

        navigate({ to: "/lists" })
      } catch (error) {
        toast.error({
          message: "Failed to create list",
          title: "Error",
        })
      }
    },
  })

  const isSubmitting = form.state.isSubmitting

  return (
    <Container p="xl" pt="xl" size="sm">
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
          <Card.Section inheritPadding py="lg">
            <Stack align="center" gap="xs">
              <Title order={2}>Create New Grocery List</Title>
              <Text c="dimmed" size="sm">
                Create a new list to organize your grocery items
              </Text>
            </Stack>
          </Card.Section>

          <Divider />

          <Card.Section
            component="form"
            inheritPadding
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            py="lg"
          >
            <form.AppForm>
              <Stack gap="md">
                <form.AppField name="name">
                  {(field) => (
                    <field.TextField
                      disabled={isSubmitting}
                      label="List Name"
                      placeholder="e.g. Weekly Groceries"
                      required
                    />
                  )}
                </form.AppField>

                <form.AppField name="description">
                  {(field) => (
                    <field.TextareaField
                      disabled={isSubmitting}
                      label="Description"
                      placeholder="Optional description for this list..."
                      rows={4}
                    />
                  )}
                </form.AppField>
              </Stack>

              <Divider my="lg" />

              <Group justify="flex-end">
                <Button
                  component={Link}
                  disabled={isSubmitting}
                  to="/lists"
                  variant="subtle"
                >
                  Cancel
                </Button>
                <form.SubmitButton label="Create List" />
              </Group>
            </form.AppForm>
          </Card.Section>
        </Card>
      </Stack>
    </Container>
  )
}
