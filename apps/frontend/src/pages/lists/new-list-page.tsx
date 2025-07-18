import { setOnSubmitErrorMap } from "@app/shared/form"
import { useAppForm } from "@app/shared/hooks/app-form"
import { useNewListMutation } from "@app/shared/hooks/lists-hooks"
import { newGroceryListFormSchema } from "@app/shared/schemas/list"
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
import { Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

export const NewListPage = () => {
  const newListMut = useNewListMutation()

  const form = useAppForm({
    defaultValues: { name: "", description: "", items: [] },
    validators: { onSubmit: newGroceryListFormSchema },

    onSubmit: async ({ value, formApi }) => {
      await newListMut.mutateAsync(value, {
        onError: (err) => {
          setOnSubmitErrorMap(err, formApi)
        },
      })
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
                    <field.TextAreaField
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
