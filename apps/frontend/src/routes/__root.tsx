/// <reference types="vite/client" />

import DefaultErrorBoundary from "@app/components/layout/DefaultErrorBoundary"
import PageNotFound from "@app/components/layout/PageNotFound"
import { PageSuspenseFallback } from "@app/components/layout/PageSuspenseFallback"
import type { OrpcReactQuery } from "@app/shared/orpc"
import { seo } from "@app/shared/seo"
import { getCachedAuthSession } from "@app/shared/session-cache"
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { Suspense } from "react"
import styles from "./styles.css?url"

export interface RouterAppContext {
  orpc: OrpcReactQuery
  queryClient: QueryClient
}

const RootDocument = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <HeadContent />
      </head>
      <body>
        <MantineProvider
          defaultColorScheme="dark"
          withCssVariables
          withGlobalClasses
        >
          {children}
          <Notifications />
        </MantineProvider>
        {import.meta.env.DEV ? (
          <>
            <ReactQueryDevtools
              buttonPosition="bottom-right"
              initialIsOpen={false}
              position="bottom"
            />
            <TanStackRouterDevtools
              initialIsOpen={false}
              position="top-right"
            />
          </>
        ) : null}
        <Scripts />
        <ColorSchemeScript defaultColorScheme="dark" />
      </body>
    </html>
  )
}

const RootComponent = () => {
  return (
    <RootDocument>
      <Suspense fallback={<PageSuspenseFallback />}>
        <Outlet />
      </Suspense>
    </RootDocument>
  )
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  notFoundComponent: () => <PageNotFound />,
  errorComponent: (props) => (
    <RootDocument>
      <DefaultErrorBoundary {...props} />
    </RootDocument>
  ),
  beforeLoad: async ({ context }) => {
    // This function will execute before every page load, and on a page transition with SSR.
    // Using React Query cache to reduce session calls, change staleTime if required
    const res = await getCachedAuthSession(context.queryClient)
    const user = res.session?.user || null

    return { user }
  },

  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Carbonteq Starter",
        description: `Starter template for building web applications with Carbonteq.`,
      }),
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
    ],
  }),
})
