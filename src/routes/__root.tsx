import "~/styles/globals.css"
import "virtual:uno.css"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { TopBar } from "~/components/header"
import { Sidebar } from "~/components/sidebar"
import { GlobalOverlayScrollbar } from "~/components/common/overlay-scrollbar"
import { Footer } from "~/components/footer"
import { Toast } from "~/components/common/toast"
import { SearchBar } from "~/components/common/search-bar"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  const nav = Route.useNavigate()
  nav({
    to: "/",
  })
}

function RootComponent() {
  useOnReload()
  useSync()
  usePWA()
  return (
    <>
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <GlobalOverlayScrollbar className="h-full min-w-0 flex-1 overflow-x-auto">
          <TopBar />
          <main className="mx-auto w-full max-w-1600px px-4 pb-10 pt-5 lg:px-8 lg:pt-7">
            <Outlet />
          </main>
          <footer className="flex flex-col items-center justify-center gap-1 py-6 font-mono text-xs text-[#7c9381] lg:hidden">
            <Footer />
          </footer>
        </GlobalOverlayScrollbar>
      </div>
      <Toast />
      <SearchBar />
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      )}
    </>
  )
}
