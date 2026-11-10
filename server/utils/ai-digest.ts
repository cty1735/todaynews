import type { AiDigestData, AiDigestItem, NewsItem, SourceID } from "@shared/types"
import { getters } from "#/getters"
import { BUCKETS, bucketOf, FALLBACK_LABEL, isAiNews } from "#/utils/ai-keywords"

const CACHE_TTL = 5 * 60_000
const DAY = 24 * 3600_000
// 站内科技/AI 相关来源；改这里即可调整日报口径
const SOURCE_IDS: SourceID[] = [
  "36kr",
  "36kr-quick",
  "ithome",
  "solidot",
  "hackernews",
  "sspai",
  "juejin",
  "producthunt",
  "github-trending-today",
]

function itemTime(item: NewsItem) {
  const value = item.pubDate ?? item.extra?.date
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

let cache: AiDigestData | undefined

export async function getAiDigest(): Promise<AiDigestData> {
  if (cache && Date.now() - cache.updatedAt < CACHE_TTL) return cache

  const now = Date.now()
  const results = await Promise.allSettled(
    SOURCE_IDS.map(async id => ({ id, items: await getters[id]() })),
  )

  const grouped = new Map<string, AiDigestItem[]>()
  const seen = new Set<string>()
  let total = 0

  for (const result of results) {
    if (result.status !== "fulfilled") continue
    const { id, items } = result.value
    const sourceName = sources[id]?.name ?? id
    for (const item of items) {
      if (!item?.url || !item.title || seen.has(item.url) || !isAiNews(item)) continue
      const publishedAt = itemTime(item)
      if (publishedAt && now - publishedAt > DAY) continue
      seen.add(item.url)
      total++
      const label = bucketOf(item)
      const list = grouped.get(label) ?? []
      list.push({ title: item.title, url: item.url, source: sourceName, publishedAt: publishedAt || undefined })
      grouped.set(label, list)
    }
  }

  const sections = [...BUCKETS.map(bucket => bucket.label), FALLBACK_LABEL]
    .map(label => {
      const items = (grouped.get(label) ?? []).sort((m, n) => (n.publishedAt ?? 0) - (m.publishedAt ?? 0))
      return { label, items }
    })
    .filter(section => section.items.length)

  if (!sections.length) {
    if (cache) return cache
    throw new Error("暂无可用的 AI 资讯")
  }

  cache = {
    updatedAt: now,
    date: new Date(now).toISOString().slice(0, 10),
    total,
    sections,
  }
  return cache
}
