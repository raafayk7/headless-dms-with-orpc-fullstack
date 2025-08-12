import { LoginPage } from "@app/pages/auth/login-page"
import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"

const LoginPageWrapper = () => {
  // https://tanstack.com/router/latest/docs/framework/react/guide/render-optimizations#fine-grained-selectors
  const redirectedTo = Route.useSearch({ select: (state) => state.redirect })
  const navigateTo = Route.useNavigate()

  return <LoginPage navigate={navigateTo} redirectTo={redirectedTo} />
}

export const Route = createFileRoute("/_public/auth/login")({
  component: LoginPageWrapper,
  head: () => ({ meta: [{ title: "Login to Carbonteq Starter" }] }),
  // https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#using-search-params-in-loaders
  //
  validateSearch: type({ redirect: "string?" }), // adds type safety + validation
})
