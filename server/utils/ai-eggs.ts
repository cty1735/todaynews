import type { AiEggGroup } from "@shared/types"
import _groups from "./ai-eggs.json"

/**
 * 赛博鸡蛋篮只读本地数据，不请求任何第三方接口。
 * 快照取自 aihot.news/free-tokens（2026-11-11），结构与其条目一致：标题、领取链接、额度、适用模型、门槛标签。
 * 换成自己的接口时改这里即可（保持 AiEggGroup[] 结构，或改成 async 函数并在调用处 await）。
 */
export const eggGroups = _groups as AiEggGroup[]

/** 快照核实日期，用于页面「更新于」 */
export const eggUpdatedAt = Date.parse("2026-11-11T00:00:00+08:00")
