const UPSTREAM = "https://api.arenaofbias.icu/api/leaderboard"
const CACHE_TTL = 5 * 60_000
const PASSTHROUGH = ["by", "category", "domain", "task", "harness", "provider"] as const

const cache = new Map<string, { at: number, data: unknown }>()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params: Record<string, string> = {}
  for (const key of PASSTHROUGH) {
    const value = query[key]
    if (typeof value === "string" && value) params[key] = value
  }

  const cacheKey = new URLSearchParams(params).toString()
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data

  // 上游没有 CORS 头，浏览器不能直连，只能由服务端代取
  const data = await myFetch(UPSTREAM, { params, timeout: 15000 })
  if (cache.size > 64) cache.clear()
  cache.set(cacheKey, { at: Date.now(), data })
  return data
})
