import { GroceryListsListPage } from "@app/pages/lists/list-page"
import { prefetchLists } from "@app/shared/hooks/lists-hooks"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_private/lists/")({
  component: () => <GroceryListsListPage />,
  head: () => ({ meta: [{ title: "All Lists" }] }),
  loader: async ({ context }) => {
    const { queryClient } = context

    await prefetchLists(queryClient)
  },
})
