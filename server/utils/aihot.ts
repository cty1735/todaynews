import type { AiDailyData, AiDailyReport, AiEggData, AiEggGroup, AiNewsEntry } from "@shared/types"
import * as cheerio from "cheerio"

// shortcut: 沿用原有 actor 标识；AIHOT 若要求独立标识需另行申请
const actor = "aihot_actor=8d0ffb92-7f76-45e4-9d1b-8341f0eabf6c"
const CACHE_TTL = 5 * 60_000
const eggsGroups = ["每天都能领", "每月都能领", "其他福利"]

let dailyCache: AiDailyData | undefined
let eggsCache: AiEggData | undefined

// 每日精编早报 + 最近 24 小时动态（/api/v1 不接受 aihot_actor，带上会 400）
export async function getDailyData(): Promise<AiDailyData> {
  if (dailyCache && Date.now() - dailyCache.updatedAt < CACHE_TTL) return dailyCache

  const [reportRes, itemsRes] = await Promise.allSettled([
    myFetch<{ report: AiDailyReport }>("https://aihot.news/api/v1/dailies/latest"),
    myFetch<any>("https://aihot.news/api/v1/items?mode=all&window=24h&limit=50"),
  ])

  const report = reportRes.status === "fulfilled" ? reportRes.value?.report : undefined
  const items: AiNewsEntry[] = itemsRes.status === "fulfilled"
    ? (Array.isArray(itemsRes.value) ? itemsRes.value : itemsRes.value?.items) ?? []
    : []
  if (!report && !items.length) {
    if (dailyCache) return dailyCache
    throw new Error("AIHOT 暂无数据")
  }

  dailyCache = { updatedAt: Date.now(), report, items }
  return dailyCache
}

// 赛博鸡蛋篮：现在能免费领的大模型 Token
// shortcut: 选择器耦合 /free-tokens 的 aria-label 与 Tailwind class，页面改版需同步
export function parseEggs(html: string): AiEggGroup[] {
  const $ = cheerio.load(html)
  return eggsGroups.map((label) => {
    const items: AiEggGroup["items"] = []
    $(`section[aria-label="${label}"] li`).each((_, elem) => {
      const $li = $(elem)
      const title = $li.find("span.font-semibold").first().text().trim()
      const url = $li.find("a[href]").first().attr("href")
      if (!title || !url) return
      items.push({
        title,
        url,
        amount: $li.find("span.text-right").first().text().trim() || undefined,
        note: $li.find(".text-ink-4").first().text().trim() || undefined,
      })
    })
    return { label, items }
  }).filter(group => group.items.length)
}

export async function getEggData(): Promise<AiEggData> {
  if (eggsCache && Date.now() - eggsCache.updatedAt < CACHE_TTL) return eggsCache

  let html: string
  try {
    html = await myFetch(`https://aihot.news/free-tokens?${actor}`, { responseType: "text" }) as string
  } catch (e) {
    if (eggsCache) return eggsCache
    throw e
  }

  const groups = parseEggs(html)

  if (!groups.length) {
    if (eggsCache) return eggsCache
    throw new Error("赛博鸡蛋篮暂无数据")
  }

  eggsCache = { updatedAt: Date.now(), groups }
  return eggsCache
}
