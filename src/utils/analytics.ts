// 百度统计：hm.js 在 index.html 里加载，_hmt 是官方队列，脚本未就绪时 push 也不会丢
declare global {
  interface Window {
    _hmt?: any[]
  }
}

/** SPA 路由切换不会发请求，需手动上报一次 PV */
export function trackPageview(path: string) {
  window._hmt?.push(["_trackPageview", path])
}

export function trackEvent(action: string, label: string, value?: string) {
  window._hmt?.push(["_trackEvent", action, label, value])
}
