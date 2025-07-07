import { createIsomorphicFn } from "@tanstack/react-start"
import { getHeaders } from "@tanstack/react-start/server"
import { createAuthClient } from "better-auth/react"
import { reactStartCookies } from "better-auth/react-start"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  basePath: "/auth",
  plugins: [reactStartCookies()],
  fetchOptions: {
    credentials: "include",
  },
})

// Due to SSR, we need a way to fetch the session on both client and server.
// The server session fetch is being passed headers to access the cookies.
export const getAuthSession = createIsomorphicFn()
  .client(async () => {
    const res = await authClient.getSession()

    const session = res.data || null

    return { session }
  })
  .server(async () => {
    const headers = getHeaders()

    const res = await authClient.getSession({
      // @ts-expect-error: bad types, description says object literal is fine
      fetchOptions: { headers },
    })

    const session = res.data || null

    return { session }
  })

export type AppSession = typeof authClient.$Infer.Session
// type ErrorCode = keyof typeof authClient.$ERROR_CODES
