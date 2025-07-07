import LoginForm from "@app/components/auth/LoginForm"
import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { useCallback } from "react"

const LoginPage = () => {
  // https://tanstack.com/router/latest/docs/framework/react/guide/render-optimizations#fine-grained-selectors
  const redirectedTo = Route.useSearch({ select: (state) => state.redirect })
  const navigateTo = Route.useNavigate()

  const onLoginSuccess = useCallback(async () => {
    if (redirectedTo) {
      navigateTo({ to: redirectedTo, replace: true })
    } else {
      navigateTo({ to: "/", replace: true })
    }
  }, [navigateTo, redirectedTo])

  return <LoginForm onLoginSuccess={onLoginSuccess} />
}

export const Route = createFileRoute("/_public/auth/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login to Carbonteq Starter" }] }),
  // https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#using-search-params-in-loaders
  //
  validateSearch: type({ redirect: "string?" }), // adds type safety + validation
})
