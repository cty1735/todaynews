import type { AiDailyData, AiEggData, AiLeaderboardData, AiNewsEntry } from "@shared/types"
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query"

const REFETCH = 5 * 60_000

const TABS = [
  { id: "daily", label: "AI 日报" },
  { id: "eggs", label: "鸡蛋" },
  { id: "board", label: "排行榜" },
] as const

type TabID = typeof TABS[number]["id"]

function Notice({ text, onRetry }: { text: string, onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 py-20">
      <p className="text-[15px] leading-7 text-[#5a7264]">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer rounded-md border border-[#b9cfb9] px-3 py-1.5 text-xs text-[#2f6a4c] transition-colors-200 hover:bg-[#eaf2e5]"
        >
          重试
        </button>
      )}
    </div>
  )
}

function UpdatedAt({ ts }: { ts: number }) {
  const text = useRelativeTime(ts)
  return <span className="font-mono text-[11px] text-[#6f8779]">更新于 {text ?? "刚刚"}</span>
}

function SectionLabel({ label, count }: { label: string, count: number }) {
  return (
    <h3 className="flex items-baseline justify-between gap-4 border-b border-[#c9dcc9] pb-2.5">
      <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#256045]">{label}</span>
      <span className="font-mono text-[11px] text-[#7f9686]">{count} 条</span>
    </h3>
  )
}

function EntryLink({ entry }: { entry: AiNewsEntry }) {
  return (
    <a
      href={entry.links?.original ?? entry.links?.aihot}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-[#e2ebe1] py-5"
    >
      <h4 className="select-text text-[16px] font-semibold leading-[1.55] text-[#16291d] transition-colors-200 group-hover:text-[#1f6b47]">
        {entry.title}
      </h4>
      {entry.summary && (
        <p className="mt-2 select-text text-[14px] leading-[1.85] text-[#3d5748]">{entry.summary}</p>
      )}
      {entry.source?.name && (
        <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-[#6f8779]">
          <span className="truncate">{entry.source.name}</span>
          <span className="i-ph:arrow-up-right shrink-0" aria-hidden="true" />
        </p>
      )}
    </a>
  )
}

export function AiColumn() {
  const [tab, setTab] = useState<TabID>("daily")
  const [flashed, setFlashed] = useState(false)
  const queryClient = useQueryClient()
  const isFetching = useIsFetching({ queryKey: ["ai", tab] })

  // 数据是本地快照，刷新只是重新读一遍文件，所以必须给个可见反馈
  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["ai", tab] })
    setFlashed(true)
    window.setTimeout(() => setFlashed(false), 1600)
  }

  return (
    <div className="mx-auto w-full max-w-980px">
      <div className="flex items-end gap-1 border-b border-[#c9dcc9]">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={$(
              "-mb-px cursor-pointer border-b-2 px-3.5 pb-2.5 pt-1 text-[15px] transition-colors-200",
              tab === item.id
                ? "border-[#1f6b47] font-semibold text-[#1f6b47]"
                : "border-transparent text-[#5a7264] hover:text-[#1f6b47]",
            )}
          >
            {item.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2.5">
          {flashed && (
            <span className="font-mono text-[11px] text-[#6f8779]">已是最新</span>
          )}
          <button
            type="button"
            title="刷新"
            aria-label="刷新"
            onClick={refresh}
            className="cursor-pointer text-lg text-[#2f6a4c] transition-colors-200 hover:text-[#1f6b47]"
          >
            <span
              className={$("block", isFetching > 0 ? "animate-spin i-ph:circle-dashed-duotone" : "i-ph:arrow-counter-clockwise-duotone")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {tab === "daily" && <DailyPage />}
      {tab === "eggs" && <EggsPage />}
      {tab === "board" && <BoardPage />}
    </div>
  )
}

function DailyPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["ai", "daily"],
    queryFn: () => myFetch<AiDailyData>("/ai/daily"),
    staleTime: REFETCH,
    refetchInterval: REFETCH,
    retry: false,
  })

  if (isPending)
    return <Notice text="正在加载今日 AI 日报…" />
  if (error || !data)
    return <Notice text="AI 日报暂时取不到，稍后再试。" onRetry={refetch} />

  const report = data.report
  const sections = report?.sections?.filter(section => section.items.length) ?? []
  const flashes = report?.flashes ?? []
  const highlights = report?.highlights ?? []

  return (
    <div className="pt-7">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[#256045]">
        <span className="tracking-[0.08em]">AI 日报{report?.date ? ` · ${report.date}` : ""}</span>
        <UpdatedAt ts={data.updatedAt} />
      </p>
      <h2 className="font-display mt-3 text-[30px] leading-[1.28] tracking-normal text-[#14291d] sm:text-[38px]">
        {report?.lead?.title ?? "今日 AI 日报"}
      </h2>
      {report?.lead?.leadParagraph && (
        <p className="mt-3.5 max-w-[46rem] select-text text-[15px] leading-[1.8] text-[#3d5748]">{report.lead.leadParagraph}</p>
      )}

      <div className={$("mt-9", highlights.length && "grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_250px]")}>
        <div>
          {sections.map(section => (
            <section key={section.label} className="mb-10 last:mb-0">
              <SectionLabel label={section.label} count={section.items.length} />
              <div>
                {section.items.map((entry, i) => <EntryLink key={entry.links?.aihot ?? `${section.label}-${i}`} entry={entry} />)}
              </div>
            </section>
          ))}

          {flashes.length > 0 && (
            <section className="mb-9 last:mb-0">
              <SectionLabel label="快讯" count={flashes.length} />
              <div>
                {flashes.map((entry, i) => <EntryLink key={entry.links?.aihot ?? `flash-${i}`} entry={entry} />)}
              </div>
            </section>
          )}
        </div>

        {highlights.length > 0 && (
          <aside className="mt-10 lg:mt-0">
            <div className="lg:sticky lg:top-28">
              <p className="border-b border-[#c9dcc9] pb-2.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#256045]">今日速览</p>
              <ol className="mt-4 flex flex-col gap-4">
                {highlights.map((entry, i) => (
                  <li key={entry.links?.aihot ?? i} className="flex gap-3">
                    <span className="mt-0.5 font-mono text-[11px] leading-6 text-[#3f9c6d]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <a
                      href={entry.links?.original ?? entry.links?.aihot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] leading-6 text-[#33493c] transition-colors-200 hover:text-[#1f6b47]"
                    >
                      {entry.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function EggsPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["ai", "eggs"],
    queryFn: () => myFetch<AiEggData>("/ai/eggs"),
    staleTime: REFETCH,
    refetchInterval: REFETCH,
    retry: false,
  })

  if (isPending)
    return <Notice text="正在获取免费额度…" />
  if (error || !data)
    return <Notice text="免费额度暂时取不到，稍后再试。" onRetry={refetch} />

  return (
    <div className="pt-7">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[#256045]">
        <span className="tracking-[0.08em]">赛博鸡蛋篮</span>
        <UpdatedAt ts={data.updatedAt} />
      </p>
      <h2 className="font-display mt-3 text-[30px] leading-[1.28] tracking-normal text-[#14291d] sm:text-[38px]">
        今天能领的 AI 额度
      </h2>
      <p className="mt-3.5 max-w-[46rem] text-[15px] leading-[1.8] text-[#3d5748]">
        现在能免费领的大模型 Token 与试用额度，点条目直达领取页。
      </p>

      {!data.groups.length && (
        <p className="mt-8 text-[15px] text-[#5a7264]">还没有收录额度，去 server/utils/ai-eggs.ts 添加。</p>
      )}

      {data.groups.map(group => (
        <section key={group.label} className="mt-9">
          <SectionLabel label={group.label} count={group.items.length} />
          <ul>
            {group.items.map((item, i) => (
              <li key={`${item.url}-${i}`}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 border-b border-[#e2ebe1] py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="select-text text-[15px] font-semibold leading-6 text-[#16291d] transition-colors-200 group-hover:text-[#1f6b47]">
                      {item.title}
                    </p>
                    {item.desc && (
                      <p className="mt-1 select-text text-[13.5px] leading-[1.75] text-[#3d5748]">{item.desc}</p>
                    )}
                    {item.note && (
                      <p className="mt-1 select-text text-[12.5px] leading-5 text-[#5a7264]">{item.note}</p>
                    )}
                  </div>
                  {item.amount && (
                    <span className="shrink-0 font-mono text-[12px] leading-6 text-[#256045]">{item.amount}</span>
                  )}
                  <span className="i-ph:arrow-up-right mt-1 shrink-0 text-lg text-[#8aa091] transition-colors-200 group-hover:text-[#1f6b47]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

const BOARD_TRACKS = ["建模", "文学", "静态网页"] as const

function BoardPage() {
  const [by, setBy] = useState<"config" | "model">("config")
  const [category, setCategory] = useState("")
  const [keyword, setKeyword] = useState("")
  const [vendor, setVendor] = useState("")

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["ai", "board", by, category],
    queryFn: () => myFetch<AiLeaderboardData>("/ai/leaderboard", {
      query: { by, ...(category ? { category } : {}) },
    }),
    staleTime: REFETCH,
    refetchInterval: REFETCH,
    retry: false,
  })

  if (isPending)
    return <Notice text="正在获取模型排行榜…" />
  if (error || !data)
    return <Notice text="排行榜暂时取不到，稍后再试。" onRetry={refetch} />

  const vendors = Array.from(new Set(data.rows.map(row => row.vendor).filter(Boolean))).sort()
  const unranked = data.unranked ?? []
  const needle = keyword.trim().toLowerCase()
  const rows = data.rows.filter(row =>
    (!vendor || row.vendor === vendor)
    && (!needle || `${row.modelName}${row.model}${row.vendor}${row.effort}`.toLowerCase().includes(needle)),
  )

  // 区间条以 1000 为基准，按全表跨度换算位置
  const low = Math.min(1000, ...rows.map(row => row.score - row.interval))
  const high = Math.max(1000, ...rows.map(row => row.score + row.interval))
  const at = (value: number) => `${((value - low) / (high - low)) * 100}%`

  return (
    <div className="pt-7">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[#256045]">
        <span className="tracking-[0.08em]">模型擂台</span>
        <span>每 {Math.round(data.refreshIntervalSeconds / 60)} 分钟更新一次 · 最近计算 {new Date(data.updatedAt).toLocaleString("zh-CN", { hour12: false })}</span>
      </p>
      <h2 className="font-display mt-3 text-[30px] leading-[1.28] tracking-normal text-[#14291d] sm:text-[38px]">
        AI 模型排行榜
      </h2>
      <p className="mt-3.5 max-w-[46rem] text-[15px] leading-[1.8] text-[#3d5748]">
        同一题面下两两对决，按 Bradley–Terry 算成 Elo 分（1000 为平均，±400 约等于 10 倍胜算）。
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex overflow-hidden rounded-md border border-[#c9dcc9]">
          {([["config", "按配置"], ["model", "按模型"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setBy(value)}
              className={$(
                "cursor-pointer px-3 py-1.5 text-[13px] transition-colors-200",
                by === value ? "bg-[#e6f0e2] font-semibold text-[#1f6b47]" : "text-[#5a7264] hover:text-[#1f6b47]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {["", ...BOARD_TRACKS].map(item => (
            <button
              key={item || "overall"}
              type="button"
              onClick={() => setCategory(item)}
              className={$(
                "cursor-pointer rounded-full px-3 py-1 text-[13px] transition-colors-200",
                category === item ? "bg-[#1f6b47] text-white" : "text-[#5a7264] hover:bg-[#eaf2e5] hover:text-[#1f6b47]",
              )}
            >
              {item || "综合"}
            </button>
          ))}
        </div>

        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="搜索模型"
          className="w-36 rounded-md border border-[#c9dcc9] bg-transparent px-3 py-1.5 text-[13px] text-[#16291d] placeholder:text-[#8aa091] focus:border-[#1f6b47] focus:outline-none"
        />
        {vendors.length > 0 && (
          <select
            value={vendor}
            onChange={event => setVendor(event.target.value)}
            className="cursor-pointer rounded-md border border-[#c9dcc9] bg-transparent px-2 py-1.5 text-[13px] text-[#3d5748] focus:border-[#1f6b47] focus:outline-none"
          >
            <option value="">全部服务商</option>
            {vendors.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-[#6f8779]">
        <span>{data.totals.votes} 次有效比较</span>
        <span>·</span>
        <span>{data.totals.voters} 位参与者</span>
        <span>·</span>
        <span>{data.rows.length} 个模型有评分</span>
      </p>

      {rows.length === 0
        ? <p className="mt-10 text-[15px] text-[#5a7264]">没有匹配的模型。</p>
        : (
            <table className="mt-4 w-full border-collapse text-[13.5px] tabular-nums">
              <thead>
                <tr className="border-b border-[#c9dcc9]">
                  {[
                    ["名次", "text-left"],
                    [by === "config" ? "模型 · 档位" : "模型", "text-left"],
                    ["评分", ""],
                    ["区间", "hidden md:table-cell"],
                    ["比较", ""],
                    ["胜 · 平 · 负", "hidden lg:table-cell"],
                    ["胜率", ""],
                    ["作品", "hidden lg:table-cell"],
                  ].map(([label, extra]) => (
                    <th key={label} className={$("whitespace-nowrap py-2 pr-3 font-mono text-[11.5px] font-normal text-[#7c9381]", extra || "text-right")}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const marks = Object.entries(data.standings ?? {})
                    .map(([track, ranks]) => ranks?.[row.key] ? `${track}第 ${ranks[row.key]}` : "")
                    .filter(Boolean)
                    .join(" · ")
                  return (
                    <tr key={row.key} className="border-b border-[#e7efe7] align-middle transition-colors-200 hover:bg-[#eaf2e5]">
                      <td className={$("py-3.5 pr-3 font-display text-[15px]", row.rank <= 3 ? "text-[#b4452f]" : "text-[#7c9381]")}>
                        {row.rank}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[14.5px] font-semibold leading-5 text-[#14291d]">{row.modelName}</span>
                          {by === "config" && row.effort && (
                            <span className="rounded bg-[#e6f0e2] px-1.5 py-0.5 font-mono text-[10.5px] text-[#2f6a4c]">{row.effort}</span>
                          )}
                          {row.provisional && (
                            <span className="rounded border border-[#d8c9a8] px-1.5 py-0.5 font-mono text-[10.5px] text-[#8a6d33]">暂定</span>
                          )}
                        </div>
                        <small className="mt-0.5 block text-[12px] leading-5 text-[#7c9381]">
                          {[row.vendor, marks].filter(Boolean).join(" · ")}
                        </small>
                      </td>
                      <td className="py-3.5 pr-3 text-right font-mono text-[20px] leading-6 text-[#14291d]">{row.score}</td>
                      <td className="hidden py-3.5 pr-3 md:table-cell">
                        <div className="relative ml-auto h-[18px] w-full max-w-[220px]">
                          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e7efe7]" />
                          <span className="absolute top-0 h-full border-l border-dashed border-[#b9cfb9]" style={{ left: at(1000) }} />
                          <span
                            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#8fbf9d]"
                            style={{ left: at(row.score - row.interval), width: `calc(${at(row.score + row.interval)} - ${at(row.score - row.interval)})` }}
                          />
                          <span className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f6b47]" style={{ left: at(row.score) }} />
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 text-right font-mono text-[13px] text-[#3d5748]">{row.games}</td>
                      <td className="hidden py-3.5 pr-3 text-right font-mono text-[12.5px] text-[#526b5d] lg:table-cell">
                        {row.wins} · {row.draws} · {row.losses}
                      </td>
                      <td className="py-3.5 pr-3 text-right font-mono text-[13px] text-[#3d5748]">{Math.round(row.winRate * 100)}%</td>
                      <td className="hidden py-3.5 text-right font-mono text-[13px] text-[#3d5748] lg:table-cell">{row.works}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

      <p className="mt-4 font-mono text-[11px] leading-5 text-[#6f8779]">
        当前范围内至少有 {data.minimumGames} 场有效比较才显示；{data.minimumGames}–{data.provisionalGames - 1} 场标为暂定。
      </p>

      {unranked.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[11px] text-[#6f8779]">还有 {unranked.length} 个模型比较场次不足</summary>
          <p className="mt-2 select-text text-[13px] leading-6 text-[#526b5d]">
            {unranked.map(item => item.modelName ?? item.model).join("、")}
          </p>
        </details>
      )}

      <details className="mt-5 border-t border-[#e2ebe1] pt-4">
        <summary className="cursor-pointer font-mono text-[11px] text-[#6f8779]">计分方法</summary>
        <dl className="mt-3 grid gap-2 text-[12.5px] leading-6 text-[#526b5d]">
          <div><dt className="inline font-semibold text-[#3d5748]">比较</dt> <dd className="inline">同题面下两两对决，胜负由观众投票决定。</dd></div>
          <div><dt className="inline font-semibold text-[#3d5748]">评分</dt> <dd className="inline">Bradley–Terry 模型拟合后换算到 Elo 刻度，1000 为平均。</dd></div>
          <div><dt className="inline font-semibold text-[#3d5748]">区间</dt> <dd className="inline">±95% 置信区间，越窄说明样本越多。</dd></div>
          <div><dt className="inline font-semibold text-[#3d5748]">范围</dt> <dd className="inline">至少 {data.minimumGames} 场有效比较才进入榜单，少于 {data.provisionalGames} 场标为暂定。</dd></div>
        </dl>
      </details>

      <p className="mt-5 font-mono text-[11px] text-[#8aa091]">
        数据实时取自 arenaofbias.icu 公开榜 <a href="https://gallery.arenaofbias.icu/#/leaderboard" target="_blank" rel="noopener noreferrer" className="underline transition-colors-200 hover:text-[#1f6b47]">查看原站</a>
      </p>
    </div>
  )
}
