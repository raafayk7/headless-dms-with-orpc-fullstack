import { RegisterPage } from "@app/pages/auth/register-page"
import { createFileRoute } from "@tanstack/react-router"

const RegisterPageWrapper = () => {
  const navigate = Route.useNavigate()

  return <RegisterPage navigate={navigate} redirectTo={undefined} />
}

export const Route = createFileRoute("/_public/auth/register")({
  component: RegisterPageWrapper,
})
