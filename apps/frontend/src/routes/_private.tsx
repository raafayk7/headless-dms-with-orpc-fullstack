import { PrivatePageLayout } from "@app/pages/layouts/private"
import { createFileRoute, redirect } from "@tanstack/react-router"

// https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes#redirecting
export const Route = createFileRoute("/_private")({
  component: PrivatePageLayout,
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      })
    }

    return { user: context.user } // to make user non-null
  },
})
