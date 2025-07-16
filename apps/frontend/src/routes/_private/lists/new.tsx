import { NewListPage } from "@app/pages/lists/new"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_private/lists/new")({
  component: NewListPage,
  head: () => ({ meta: [{ title: "Create New List" }] }),
})
