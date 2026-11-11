import type { colors } from "unocss/preset-mini"
import type { columns, fixedColumnIds } from "./metadata"
import type { originSources } from "./pre-sources"

export type Color = "primary" | Exclude<keyof typeof colors, "current" | "inherit" | "transparent" | "black" | "white">

type ConstSources = typeof originSources
type MainSourceID = keyof(ConstSources)

export type SourceID = {
  [Key in MainSourceID]: ConstSources[Key] extends { disable?: true } ? never :
    ConstSources[Key] extends { sub?: infer SubSource } ? {
    // @ts-expect-error >_<
      [SubKey in keyof SubSource]: SubSource[SubKey] extends { disable?: true } ? never : `${Key}-${SubKey}`
    }[keyof SubSource] | Key : Key;
}[MainSourceID]

export type AllSourceID = {
  [Key in MainSourceID]: ConstSources[Key] extends { sub?: infer SubSource } ? keyof {
    // @ts-expect-error >_<
    [SubKey in keyof SubSource as `${Key}-${SubKey}`]: never
  } | Key : Key
}[MainSourceID]

// export type DisabledSourceID = Exclude<SourceID, MainSourceID>

export type ColumnID = keyof typeof columns
export type Metadata = Record<ColumnID, Column>

export interface PrimitiveMetadata {
  updatedTime: number
  data: Record<FixedColumnID, SourceID[]>
  action: "init" | "manual" | "sync"
}

export type FixedColumnID = (typeof fixedColumnIds)[number]
export type HiddenColumnID = Exclude<ColumnID, FixedColumnID>

export interface OriginSource extends Partial<Omit<Source, "name" | "redirect">> {
  name: string
  sub?: Record<string, {
    /**
     * Subtitle 小标题
     */
    title: string
    // type?: "hottest" | "realtime"
    // desc?: string
    // column?: ManualColumnID
    // color?: Color
    // home?: string
    // disable?: boolean
    // interval?: number
  } & Partial<Omit<Source, "title" | "name" | "redirect">>>
}

export interface Source {
  name: string
  /**
   * 刷新的间隔时间
   */
  interval: number
  color: Color

  /**
   * Subtitle 小标题
   */
  title?: string
  desc?: string
  /**
   * Default normal timeline
   */
  type?: "hottest" | "realtime"
  column?: HiddenColumnID
  home?: string
  /**
   * @default false
   */
  disable?: boolean | "cf"
  redirect?: SourceID
}

export interface Column {
  name: string
  sources: SourceID[]
}

export interface NewsItem {
  id: string | number // unique
  title: string
  url: string
  mobileUrl?: string
  pubDate?: number | string
  extra?: {
    hover?: string
    date?: number | string
    info?: false | string
    diff?: number
    icon?: false | string | {
      url: string
      scale: number
    }
  }
}

export interface SourceResponse {
  status: "success" | "cache"
  id: SourceID
  updatedTime: number | string
  items: NewsItem[]
  info?: any
}

/** AI 日报条目 */
export interface AiNewsEntry {
  title: string
  summary?: string
  leadParagraph?: string
  source?: { name?: string }
  links?: { aihot?: string, original?: string }
  publishedAt?: string
}

export interface AiDailyReport {
  date: string
  generatedAt?: string
  links?: { aihot?: string }
  lead?: AiNewsEntry
  highlights?: AiNewsEntry[]
  sections?: Array<{ label: string, items: AiNewsEntry[] }>
  flashes?: AiNewsEntry[]
}

export interface AiDailyData {
  updatedAt: number
  report?: AiDailyReport
  items: AiNewsEntry[]
}

/** 赛博鸡蛋篮条目（本地维护） */
export interface AiEggItem {
  title: string
  url: string
  amount?: string
  /** 适用模型等一句话说明 */
  desc?: string
  /** 门槛标签串，如「部分模型 · 要实名 · 11月11日核实」 */
  note?: string
}

export interface AiEggGroup {
  label: string
  items: AiEggItem[]
}

export interface AiEggData {
  updatedAt: number
  groups: AiEggGroup[]
}

/** 模型排行榜单行（字段来自 arenaofbias 上游） */
export interface AiLeaderboardRow {
  rank: number
  key: string
  model: string
  modelName: string
  vendor: string
  effort: string
  score: number
  /** ±95% 置信区间 */
  interval: number
  games: number
  wins: number
  draws: number
  losses: number
  winRate: number
  voters: number
  tasks: number
  works: number
  provisional: boolean
}

export interface AiLeaderboardData {
  category?: string
  by?: string
  /** 综合榜下每个赛道各自的模型名次；按 category 过滤时上游不给 */
  standings?: Record<string, Record<string, number>>
  totals: { votes: number, voters: number, entries: number, tasks: number }
  rows: AiLeaderboardRow[]
  unranked?: Array<{ modelName?: string, model?: string }>
  provisionalGames: number
  minimumGames: number
  refreshIntervalSeconds: number
  updatedAt: string
}
