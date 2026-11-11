import type { AiNewsEntry, NewsItem } from "@shared/types"
import { eggGroups } from "#/utils/ai-eggs"
import { getDailyData } from "#/utils/ai-news"

function time(entry: AiNewsEntry) {
  const ts = entry.publishedAt ? Date.parse(entry.publishedAt) : Number.NaN
  return Number.isNaN(ts) ? undefined : ts
}

const daily = defineSource(async () => {
  const { report } = getDailyData()
  const groups = [...(report?.sections ?? []), { label: "快讯", items: report?.flashes ?? [] }]
  const news: NewsItem[] = []
  for (const group of groups) {
    for (const item of group.items) {
      const url = item.links?.original ?? item.links?.aihot
      if (!url || !item.title) continue
      news.push({
        id: url,
        url,
        title: item.title,
        pubDate: time(item),
        extra: { info: group.label, hover: item.source?.name },
      })
    }
  }
  if (!news.length) throw new Error("暂无 AI 资讯")
  return news
})

const eggs = defineSource(async () => eggGroups.flatMap(group => group.items.map(item => ({
  id: `${group.label} · ${item.title}`,
  url: item.url,
  title: item.title,
  extra: {
    info: group.label,
    hover: item.amount || item.desc,
  },
}))))

export default defineSource({
  "ai-daily": daily,
  "ai-eggs": eggs,
})
