import { describe, expect, it } from "vitest"
import { parseEggs } from "./aihot"

const html = `
<section aria-label="每天都能领">
  <ul>
    <li>
      <a href="https://a.example/claim"><span class="font-semibold">A 平台</span></a>
      <span class="text-ink-4">每天 100 万 token</span>
      <span class="text-right">¥20/天</span>
    </li>
    <li><span class="font-semibold">没有链接的条目</span></li>
  </ul>
</section>
<section aria-label="每月都能领">
  <ul><li><a href="https://b.example"><span class="font-semibold">B 平台</span></a></li></ul>
</section>
<section aria-label="其他福利"><ul></ul></section>
`

describe("parseEggs", () => {
  it("按分组解析标题、链接、额度与备注，跳过无链接条目与空分组", () => {
    expect(parseEggs(html)).toEqual([
      {
        label: "每天都能领",
        items: [{ title: "A 平台", url: "https://a.example/claim", amount: "¥20/天", note: "每天 100 万 token" }],
      },
      {
        label: "每月都能领",
        items: [{ title: "B 平台", url: "https://b.example", amount: undefined, note: undefined }],
      },
    ])
  })

  it("页面结构变化时返回空数组而不是抛错", () => {
    expect(parseEggs("<html><body>改版了</body></html>")).toEqual([])
  })
})
