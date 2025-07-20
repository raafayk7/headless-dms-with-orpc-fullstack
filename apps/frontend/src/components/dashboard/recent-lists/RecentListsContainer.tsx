import { useRecentLists } from "@app/shared/hooks/dashboard-hooks"
import { RecentLists } from "./RecentLists"
import { RecentListsEmpty } from "./RecentListsEmpty"

export const RecentListsContainer = () => {
  const { data: lists } = useRecentLists()

  if (!lists || lists.length === 0) {
    return <RecentListsEmpty />
  }

  return <RecentLists lists={lists} />
}
