import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

// shortcut: 沿用原有 actor 标识；AIHOT 若要求独立标识需另行申请
const actor = "aihot_actor=8d0ffb92-7f76-45e4-9d1b-8341f0eabf6c"

type Entry = {
  title?: string
  summary?: string
  leadParagraph?: string
  source?: { name?: string }
  links?: { aihot?: string, original?: string }
  publishedAt?: string
}

function toItem(e: Entry, info?: string, pubDateFallback?: string): NewsItem | undefined {
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

// 每日精编早报 + 最近 24 小时动态（/api/v1 不接受 aihot_actor，带上会 400）
const daily = defineSource(async () => {
  const [reportRes, itemsRes] = await Promise.allSettled([
    myFetch<any>("https://aihot.news/api/v1/dailies/latest"),
    myFetch<any>("https://aihot.news/api/v1/items?mode=all&window=24h&limit=50"),
  ])

  const report = reportRes.status === "fulfilled" ? reportRes.value?.report : undefined
  const items: Entry[] = itemsRes.status === "fulfilled"
    ? (Array.isArray(itemsRes.value) ? itemsRes.value : itemsRes.value?.items) ?? []
    : []
  if (!report && !items.length) throw new Error("AIHOT 暂无数据")

  const news: NewsItem[] = []
  const seen = new Set<string>()
  const push = (n: NewsItem | undefined) => {
    if (!n || seen.has(n.url) || seen.has(n.title)) return
    seen.add(n.url).add(n.title)
    news.push(n)
  }

  if (report) {
    const date = report.date as string
    push(toItem({ ...report.lead, links: { aihot: report.links?.aihot } }, "AI日报", date))
    for (const e of report.highlights ?? []) push(toItem(e, "AI日报", date))
    for (const section of report.sections ?? []) for (const e of section.items ?? []) push(toItem(e, "AI日报", date))
    for (const e of report.flashes ?? []) push(toItem(e))
  }
  for (const e of items) push(toItem(e))

  return news
})

// 赛博鸡蛋篮：现在能免费领的大模型 Token
// shortcut: 选择器耦合 /free-tokens 的 aria-label 与 Tailwind class，页面改版需同步；接口每源上限 30 条，「其他福利」会被截断
const eggsGroups = ["每天都能领", "每月都能领", "其他福利"]

const eggs = defineSource(async () => {
  const html: string = await myFetch(`https://aihot.news/free-tokens?${actor}`, { responseType: "text" as any })
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  for (const label of eggsGroups) {
    $(`section[aria-label="${label}"] li`).each((_, elem) => {
      const $li = $(elem)
      const title = $li.find("span.font-semibold").first().text().trim()
      const url = $li.find("a[href]").first().attr("href")
      if (!title || !url) return
      const amount = $li.find("span.text-right").first().text().trim()
      news.push({
        // 同一链接可能出现在多个分组里，id 用组名+标题保证 React key 唯一
        id: `${label} · ${title}`,
        url,
        title: `${label} · ${title}`,
        extra: {
          // 标题里已含额度就不再重复
          info: amount && !title.includes(amount) ? amount : false,
          hover: $li.find(".text-ink-4").first().text().trim(),
        },
      })
    })
  }

  if (!news.length) throw new Error("赛博鸡蛋篮暂无数据")
  return news
})

export default defineSource({
  "aihot": defineRSSSource(`https://aihot.news/feed/all.xml?${actor}`),
  "aihot-daily": daily,
  "aihot-eggs": eggs,
})
