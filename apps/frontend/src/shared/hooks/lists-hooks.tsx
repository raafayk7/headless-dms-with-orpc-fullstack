import { orpc } from "@app/shared/orpc"
import type { NewGroceryListFormData } from "@app/shared/schemas/list"
import {
  type QueryClient,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { toast } from "../toast"
import { useNavigate, type UseNavigateResult } from "@tanstack/react-router"

type Params = {
  limit?: number
  page?: number
  search?: string
  status?: "active" | "inactive"
}

const listsQueryOptions = (params: Params = {}) => {
  return orpc.authenticated.groceryList.getLists.queryOptions({
    input: {
      limit: 50,
      page: 1,
      search: undefined,
      status: undefined,
      ...params,
    },
  })
}

const listQueryOptions = (id: string) =>
  orpc.authenticated.groceryList.getListById.queryOptions({
    input: { params: { id } },
  })

export const prefetchList = (queryClient: QueryClient, id: string) =>
  queryClient.ensureQueryData(listQueryOptions(id))
export const useList = (id: string) => useSuspenseQuery(listQueryOptions(id))

export const prefetchLists = (queryClient: QueryClient) =>
  queryClient.ensureQueryData(
    listsQueryOptions({ limit: 5, page: 1, search: "" }),
  )

export const useLists = (params: Params = {}) =>
  useSuspenseQuery(listsQueryOptions(params))

export const useNewListMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const listsKey = orpc.authenticated.groceryList.getLists.key()

  const mutOpts =
    orpc.authenticated.groceryList.createGroceryList.mutationOptions({
      onError: (err) => {
        toast.error({
          message: err.message,
          title: "Failed to create grocery list",
        })
      },
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: listsKey,
        })
        queryClient.setQueryData(
          orpc.authenticated.groceryList.getListById.key({
            input: { params: { id: data.id } },
          }),
          data,
        )
        toast.success({ message: `List ${data.name} created successfully!` })
        navigate({
          to: `/lists/${data.id}`,
          from: "/lists/new",
          replace: false,
        })
      },
    })

  return useMutation(mutOpts, queryClient)
}
