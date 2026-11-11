import ReactDOM from "react-dom/client"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { routeTree } from "./routeTree.gen"
import "./utils/pwa"
import { trackPageview } from "./utils/analytics"

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  // Vite base（默认 /，子路径部署时如 /todaynews/）
  basepath: import.meta.env.BASE_URL.replace(/\/+$/, "") || "/",
  context: {
    queryClient,
  },
})

const rootElement = document.getElementById("app")!

// 首屏由 hm.js 自己记一次，之后的路由切换手动补
// 带上部署子路径，好让百度统计的「页面/目录」把两个站分开
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "")
let firstResolved = true
router.subscribe("onResolved", ({ toLocation }) => {
  if (firstResolved) {
    firstResolved = false
    return
  }
  trackPageview(BASE + toLocation.pathname)
})

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
