import LoginForm from "@app/components/auth/LoginForm"
import type { UseNavigateResult } from "@tanstack/react-router"

type LoginPageProps<T extends string> = {
  redirectTo: string | undefined
  navigate: UseNavigateResult<T>
}

export function LoginPage<T extends string>({
  redirectTo,
  navigate,
}: LoginPageProps<T>) {
  const onLoginSuccess = async () => {
    if (redirectTo) {
      navigate({ to: redirectTo, replace: true })
    } else {
      navigate({ to: "/", replace: true })
    }
  }

  return <LoginForm onLoginSuccess={onLoginSuccess} />
}
