import type { AiDailyData, AiEggData, AiNewsEntry } from "@shared/types"
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query"

const TABS = [
  { id: "daily", label: "AI 日报" },
  { id: "eggs", label: "鸡蛋" },
] as const

type TabID = typeof TABS[number]["id"]

const REFETCH = 10 * 60_000
const origin = "https://aihot.news"

function absolute(url?: string) {
  if (!url)
    return undefined
  return url.startsWith("http") ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`
}

export function AiColumn() {
  const [tab, setTab] = useState<TabID>("daily")
  const queryClient = useQueryClient()
  const isFetching = useIsFetching({ queryKey: ["aihot"] })

  return (
    <div className="mx-auto w-full max-w-980px">
      <div className="flex items-end gap-1 border-b border-[#c9dcc9]">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={$(
              "-mb-px cursor-pointer border-b-2 px-3 pb-2.5 pt-1 text-sm transition-colors-200",
              tab === item.id
                ? "border-[#1f6b47] font-semibold text-[#1f6b47]"
                : "border-transparent text-[#6c8371] hover:text-[#1f6b47]",
            )}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          title="刷新"
          aria-label="刷新"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["aihot"] })}
          className="ml-auto mb-2.5 cursor-pointer text-base text-[#2f6a4c] transition-colors-200 hover:text-[#1f6b47]"
        >
          <span
            className={$("i-ph:arrow-counter-clockwise-duotone", isFetching > 0 && "animate-spin i-ph:circle-dashed-duotone")}
            aria-hidden="true"
          />
        </button>
      </div>

      {tab === "daily" ? <DailyPage /> : <EggsPage />}
    </div>
  )
}

function Notice({ text, onRetry }: { text: string, onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 py-20">
      <p className="text-sm text-[#7c9381]">{text}</p>
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
  return <span className="normal-case tracking-normal text-[#8aa091]">更新于 {text ?? "刚刚"}</span>
}

function EntryLink({ entry }: { entry: AiNewsEntry }) {
  const href = absolute(entry.links?.original) ?? absolute(entry.links?.aihot)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block py-4"
    >
      <h4 className="text-[15px] font-semibold leading-6 text-[#1b3325] transition-colors-200 group-hover:text-[#1f6b47]">
        {entry.title}
      </h4>
      {entry.summary && (
        <p className="mt-1.5 select-text text-[13px] leading-6 text-[#526b5d]">{entry.summary}</p>
      )}
      <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[#8aa091]">
        {entry.source?.name && <span className="truncate">{entry.source.name}</span>}
        <span className="i-ph:arrow-up-right shrink-0" aria-hidden="true" />
      </p>
    </a>
  )
}

function SectionLabel({ label, count }: { label: string, count?: number }) {
  return (
    <h3 className="flex items-baseline justify-between border-b border-[#c9dcc9] pb-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2f6a4c]">{label}</span>
      {count !== undefined && <span className="font-mono text-[10px] text-[#a2b5a6]">{count} 项</span>}
    </h3>
  )
}

function DailyPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["aihot", "daily"],
    queryFn: () => myFetch<AiDailyData>("/aihot/daily"),
    staleTime: REFETCH,
    refetchInterval: REFETCH,
    retry: false,
  })

  if (isPending)
    return <Notice text="正在获取今日 AI 日报…" />
  if (error || !data)
    return <Notice text="AI 日报暂时取不到，稍后再试。" onRetry={refetch} />

  const { report } = data
  const lead = report?.lead
  const sections = report?.sections?.filter(section => section.items.length) ?? []
  const highlights = report?.highlights ?? []

  return (
    <div className="pt-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#2f6a4c]">
        <span>AI 日报{report?.date ? ` · ${report.date}` : ""}</span>
        <span className="h-3 w-px bg-[#c9dcc9]" />
        <UpdatedAt ts={data.updatedAt} />
      </div>

      <h2 className="font-display mt-3 max-w-3xl text-[28px] leading-[1.2] tracking-[-0.01em] text-[#14291d] sm:text-[36px]">
        {lead?.title ?? "今日 AI 日报"}
      </h2>
      {lead?.leadParagraph && (
        <p className="mt-4 max-w-3xl select-text text-[15px] leading-7 text-[#3d5748]">{lead.leadParagraph}</p>
      )}

      <div className={$("mt-9", highlights.length && "grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_230px]")}>
        <div>
          {sections.length
            ? sections.map(section => (
                <section key={section.label} className="mb-9 last:mb-0">
                  <SectionLabel label={section.label} count={section.items.length} />
                  <div className="divide-y divide-[#e7efe7]">
                    {section.items.map((entry, i) => (
                      <EntryLink key={entry.links?.aihot ?? `${section.label}-${i}`} entry={entry} />
                    ))}
                  </div>
                </section>
              ))
            : (
                <section>
                  <SectionLabel label="近 24 小时" count={data.items.length} />
                  <div className="divide-y divide-[#e7efe7]">
                    {data.items.map((entry, i) => <EntryLink key={entry.links?.aihot ?? i} entry={entry} />)}
                  </div>
                </section>
              )}
        </div>

        {highlights.length > 0 && (
          <aside className="mt-10 lg:mt-0">
            <div className="lg:sticky lg:top-28">
              <p className="border-b border-[#c9dcc9] pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#2f6a4c]">今日速览</p>
              <ol className="mt-4 flex flex-col gap-4">
                {highlights.map((entry, i) => {
                  const href = absolute(entry.links?.original) ?? absolute(entry.links?.aihot)
                  return (
                    <li key={entry.links?.aihot ?? i} className="flex gap-3">
                      <span className="mt-0.5 font-mono text-[10px] leading-5 text-[#3f9c6d]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] leading-5 text-[#3d5748] transition-colors-200 hover:text-[#1f6b47]"
                      >
                        {entry.title}
                      </a>
                    </li>
                  )
                })}
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
    queryKey: ["aihot", "eggs"],
    queryFn: () => myFetch<AiEggData>("/aihot/eggs"),
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#2f6a4c]">
        <span>赛博鸡蛋篮</span>
        <span className="h-3 w-px bg-[#c9dcc9]" />
        <UpdatedAt ts={data.updatedAt} />
      </div>

      <h2 className="font-display mt-3 text-[28px] leading-[1.2] tracking-[-0.01em] text-[#14291d] sm:text-[36px]">
        今天能领的 AI 额度
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#3d5748]">
        每天可领的免费 Token 与试用额度，点条目直达领取页。
      </p>

      {data.groups.map(group => (
        <section key={group.label} className="mt-9">
          <SectionLabel label={group.label} count={group.items.length} />
          <ul>
            {group.items.map((item, i) => (
              <li key={`${item.url}-${i}`}>
                <a
                  href={absolute(item.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 border-b border-[#e7efe7] py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="select-text text-[14px] font-medium leading-6 text-[#1b3325] transition-colors-200 group-hover:text-[#1f6b47]">
                      {item.title}
                    </p>
                    {item.note && (
                      <p className="mt-0.5 select-text text-[12px] leading-5 text-[#7c9381]">{item.note}</p>
                    )}
                  </div>
                  {item.amount && (
                    <span className="shrink-0 font-mono text-[11px] leading-6 text-[#2f6a4c]">{item.amount}</span>
                  )}
                  <span className="i-ph:arrow-up-right mt-1 shrink-0 text-base text-[#a2b5a6] transition-colors-200 group-hover:text-[#1f6b47]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
