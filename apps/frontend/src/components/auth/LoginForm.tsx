import { useAppForm } from "@app/shared/hooks/app-form"
import { useLoginMutation } from "@app/shared/hooks/auth-hooks"
import { loginFormSchema } from "@app/shared/schemas/auth"
import { Card, Divider, Stack, Text, Title } from "@mantine/core"
import AnchorLink from "../layout/AnchorLink"

type LoginFormProps = {
  onLoginSuccess: () => Promise<void>
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const loginMut = useLoginMutation()

  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginFormSchema },

    onSubmit: async ({ value }) => {
      await loginMut.mutateAsync(value, {
        onSuccess: async (data) => {
          if (data.data) {
            await onLoginSuccess()
          }
        },
      })
    },
  })

  const authPending = form.state.isSubmitting

  return (
    <Card miw="65%" p="lg" radius="lg" shadow="md" withBorder>
      <Card.Section inheritPadding py="lg">
        <Stack align="center" gap="xs">
          <Title order={2}>Login to Carbonteq</Title>
          <Text c="dimmed" size="sm">
            Don't have an account yet?{" "}
            <AnchorLink preload="intent" size="sm" to="/auth/register">
              Sign Up
            </AnchorLink>
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
        py="xs"
      >
        <form.AppForm>
          <Stack gap="md">
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  disabled={authPending}
                  label="Email"
                  placeholder="your@email.com"
                  required
                  type="email"
                />
              )}
            </form.AppField>
            <form.AppField name="password">
              {(field) => (
                <field.PasswordField
                  disabled={authPending}
                  label="Password"
                  placeholder="Your password"
                  required
                  type="password"
                />
              )}
            </form.AppField>
          </Stack>
          <Divider my="md" />
          <form.SubmitButton fullWidth label="Login" />
        </form.AppForm>
      </Card.Section>
    </Card>
  )
}

export default LoginForm
