import type { NewsItem } from "@shared/types"
import { describe, expect, it } from "vitest"
import { bucketOf, isAiNews } from "./ai-keywords"

const item = (title: string): NewsItem => ({ id: title, title, url: `https://example.com/${encodeURIComponent(title)}` })

describe("ai-keywords", () => {
  it("filters AI news from general tech feeds", () => {
    expect(isAiNews(item("Anthropic 发布 Claude Fable 5.2"))).toBe(true)
    expect(isAiNews(item("OpenAI 宣布新定价"))).toBe(true)
    expect(isAiNews(item("某地发布暴雨橙色预警"))).toBe(false)
    expect(isAiNews(item("新款机械键盘上架"))).toBe(false)
  })

  it("buckets AI news by topic", () => {
    expect(bucketOf(item("OpenAI 发布 GPT-6"))).toBe("模型与产品")
    expect(bucketOf(item("英伟达数据中心营收创新高"))).toBe("行业与算力")
    expect(bucketOf(item("Cursor 智能体编程实测"))).toBe("开发与工具")
    expect(bucketOf(item("AI 主播走红网络"))).toBe("其他动态")
  })
})
