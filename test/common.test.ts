import { expect, it, vi } from "vitest"
import nowcoder from "../server/sources/nowcoder"
import { myFetch } from "../server/utils/fetch"

vi.mock("../server/utils/fetch", () => ({ myFetch: vi.fn() }))

it("keeps supported Nowcoder links and skips unknown content types", async () => {
  vi.mocked(myFetch).mockResolvedValue({
    data: {
      result: [
        { type: 74, uuid: "feed-1", id: "1", title: "动态" },
        { type: 0, uuid: "", id: "2", title: "讨论" },
        { type: 999, uuid: "", id: "3", title: "未知类型" },
      ],
    },
  })
  expect(await nowcoder()).toEqual([
    { id: "feed-1", title: "动态", url: "https://www.nowcoder.com/feed/main/detail/feed-1" },
    { id: "2", title: "讨论", url: "https://www.nowcoder.com/discuss/2" },
  ])
})
