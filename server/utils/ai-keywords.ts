import type { NewsItem } from "@shared/types"

const AI_RE = /(?:\bAI\b|AIGC|\bLLM\b|GPT|Claude|Gemini|DeepSeek|Qwen|Llama|OpenAI|Anthropic|Copilot|Cursor|\bMCP\b|\bRAG\b|大模型|智能体|多模态|机器学习|神经网络|算力|英伟达|NVIDIA|芯片|文生图|文生视频|提示词)/i

export const BUCKETS: Array<{ label: string, re: RegExp }> = [
  { label: "模型与产品", re: /GPT|Claude|Gemini|DeepSeek|Qwen|Llama|大模型|LLM|多模态|文生|生成式|模型/i },
  { label: "行业与算力", re: /英伟达|NVIDIA|AMD|芯片|算力|数据中心|融资|收购|IPO|OpenAI|Anthropic|微软|谷歌|Meta|字节|阿里|腾讯|百度/i },
  { label: "开发与工具", re: /智能体|Agent|Copilot|Cursor|MCP|RAG|提示词|开源|API|编程|代码|GitHub/i },
]
export const FALLBACK_LABEL = "其他动态"

function textOf(item: NewsItem) {
  const info = typeof item.extra?.info === "string" ? item.extra.info : ""
  return `${item.title} ${info}`
}

export function isAiNews(item: NewsItem) {
  return AI_RE.test(textOf(item))
}

export function bucketOf(item: NewsItem) {
  const text = textOf(item)
  return BUCKETS.find(bucket => bucket.re.test(text))?.label ?? FALLBACK_LABEL
}
