import type { AiNewsEntry, NewsItem } from "@shared/types"
import { getDailyData, getEggData } from "#/utils/aihot"

// shortcut: 沿用原有 actor 标识；AIHOT 若要求独立标识需另行申请
const actor = "aihot_actor=8d0ffb92-7f76-45e4-9d1b-8341f0eabf6c"

function toItem(e: AiNewsEntry, info?: string, pubDateFallback?: string): NewsItem | undefined {
  const title = (e.title || "").trim()
  const url = e.links?.aihot || e.links?.original
  if (!title || !url) return
  return {
    id: url,
    url,
    title,
    pubDate: e.publishedAt || pubDateFallback,
    extra: {
      info,
      hover: (e.summary || e.leadParagraph || e.source?.name || "").trim(),
    },
  }
}

const daily = defineSource(async () => {
  const { report, items } = await getDailyData()
  const news: NewsItem[] = []
  const seen = new Set<string>()
  const push = (n: NewsItem | undefined) => {
    if (!n || seen.has(n.url) || seen.has(n.title)) return
    seen.add(n.url).add(n.title)
    news.push(n)
  }

  if (report) {
    const date = report.date
    if (report.lead) push(toItem({ ...report.lead, links: { aihot: report.links?.aihot } }, "AI日报", date))
    for (const e of report.highlights ?? []) push(toItem(e, "AI日报", date))
    for (const section of report.sections ?? []) for (const e of section.items ?? []) push(toItem(e, "AI日报", date))
    for (const e of report.flashes ?? []) push(toItem(e))
  }
  for (const e of items) push(toItem(e))

  if (!news.length) throw new Error("AIHOT 暂无数据")
  return news
})

const eggs = defineSource(async () => {
  const { groups } = await getEggData()
  // 同一链接可能出现在多个分组里，id 用组名+标题保证 React key 唯一
  return groups.flatMap(group => group.items.map(item => ({
    id: `${group.label} · ${item.title}`,
    url: item.url,
    title: `${group.label} · ${item.title}`,
    extra: {
      info: item.amount && !item.title.includes(item.amount) ? item.amount : false,
      hover: item.note,
    },
  })))
})

export default defineSource({
  "aihot": defineRSSSource(`https://aihot.news/feed/all.xml?${actor}`),
  "aihot-daily": daily,
  "aihot-eggs": eggs,
})
