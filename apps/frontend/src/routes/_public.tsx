import { PublicPageLayout } from "@app/pages/layouts/public"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_public")({
  component: PublicPageLayout,
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" })
    }

    return { user: null } // ensure user cannot be accessed in public routes
  },
})
