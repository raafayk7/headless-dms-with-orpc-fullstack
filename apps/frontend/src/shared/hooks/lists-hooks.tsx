import { orpc } from "@app/shared/orpc"
import { isDefinedError } from "@orpc/client"
import {
  type QueryClient,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "../toast"

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
      throwOnError: false,
      onError: (err) => {
        if (isDefinedError(err)) {
          console.debug("defined error")
        } else {
          console.debug("undefined error")
        }
        toast.error({
          title: "Failed to create grocery list",
          message: err.message,
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
