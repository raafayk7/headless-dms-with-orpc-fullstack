import RegisterForm from "@app/components/auth/RegisterForm"
import type { UseNavigateResult } from "@tanstack/react-router"

type ReegisterPageProps<T extends string> = {
  redirectTo: string | undefined
  navigate: UseNavigateResult<T>
}

export function RegisterPage<T extends string>({
  redirectTo,
  navigate,
}: ReegisterPageProps<T>) {
  const onRegisterSuccess = async () => {
    if (redirectTo) {
      navigate({ to: redirectTo, replace: true })
    } else {
      navigate({ to: "/", replace: true })
    }
  }

  return <RegisterForm onRegisterSuccess={onRegisterSuccess} />
}
