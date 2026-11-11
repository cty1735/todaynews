import type { AiDailyData, AiDailyReport } from "@shared/types"
import _report from "./ai-news.json"

// 本地快照，不请求第三方；数据取自已下线的 aihot.news 日报（2026-11-11）
const report = _report as unknown as AiDailyReport

export function getDailyData(): AiDailyData {
  return { updatedAt: Date.parse(report.generatedAt ?? report.date), report, items: [] }
}
