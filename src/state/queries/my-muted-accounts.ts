import {AppBskyGraphGetMutes} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

export const RQKEY = () => ['my-muted-accounts']
type RQPageParam = string | undefined

export function useMyMutedAccountsQuery() {
  return useInfiniteQuery<
    AppBskyGraphGetMutes.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetMutes.OutputSchema>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      const res = await getAgent().app.bsky.graph.getMutes({
        limit: 30,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}
