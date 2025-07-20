import { GroceryListsListPage } from "@app/pages/lists/list-page"
import { prefetchLists } from "@app/shared/hooks/lists-hooks"
import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"

const urlSearchParams = type({
  search: "string = ''",
  status: "'active' | 'inactive' | '' = ''",
  page: "number>=1 = 1",
  limit: "number>=1 = 10",
})

export const Route = createFileRoute("/_private/lists/")({
  component: () => <GroceryListsListPage />,
  head: () => ({ meta: [{ title: "All Lists" }] }),
  validateSearch: urlSearchParams,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps: { search } }) => {
    const { queryClient } = context

    await prefetchLists(queryClient, {
      ...search,
      status: search.status || undefined,
    })
  },
})
