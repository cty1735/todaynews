import type { AiDigestData, AiDigestItem } from "@shared/types"
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query"

const REFETCH = 5 * 60_000

function timeLabel(ts?: number) {
  if (!ts) return ""
  return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
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
  return <span className="font-mono text-[10px] text-[#8aa091]">更新于 {text ?? "刚刚"}</span>
}

function SectionLabel({ label, count }: { label: string, count: number }) {
  return (
    <h3 className="flex items-baseline justify-between border-b border-[#c9dcc9] pb-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2f6a4c]">{label}</span>
      <span className="font-mono text-[10px] text-[#a2b5a6]">{count} 条</span>
    </h3>
  )
}

function Entry({ entry }: { entry: AiDigestItem }) {
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 border-b border-[#e7efe7] py-3.5"
    >
      <div className="min-w-0 flex-1">
        <h4 className="select-text text-[15px] font-semibold leading-6 text-[#1b3325] transition-colors-200 group-hover:text-[#1f6b47]">
          {entry.title}
        </h4>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-[#8aa091]">
          {entry.source && <span className="truncate">{entry.source}</span>}
          {entry.publishedAt && (
            <>
              <span className="h-2 w-px bg-[#c9dcc9]" />
              <span>{timeLabel(entry.publishedAt)}</span>
            </>
          )}
        </p>
      </div>
      <span className="i-ph:arrow-up-right mt-1 shrink-0 text-base text-[#a2b5a6] transition-colors-200 group-hover:text-[#1f6b47]" aria-hidden="true" />
    </a>
  )
}

export function AiColumn() {
  const queryClient = useQueryClient()
  const isFetching = useIsFetching({ queryKey: ["ai", "daily"] })
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["ai", "daily"],
    queryFn: () => myFetch<AiDigestData>("/ai/daily"),
    staleTime: REFETCH,
    refetchInterval: REFETCH,
    retry: false,
  })

  return (
    <div className="mx-auto w-full max-w-980px">
      <div className="flex items-center justify-between gap-3 border-b border-[#c9dcc9] pb-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2f6a4c]">AI 日报</p>
        <div className="flex items-center gap-3">
          {data && <UpdatedAt ts={data.updatedAt} />}
          <button
            type="button"
            title="刷新"
            aria-label="刷新"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["ai", "daily"] })}
            className="cursor-pointer text-base text-[#2f6a4c] transition-colors-200 hover:text-[#1f6b47]"
          >
            <span
              className={$("i-ph:arrow-counter-clockwise-duotone", isFetching > 0 && "animate-spin i-ph:circle-dashed-duotone")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {isPending
        ? <Notice text="正在汇总今日 AI 资讯…" />
        : error || !data
          ? <Notice text="AI 日报暂时取不到，稍后再试。" onRetry={refetch} />
          : (
              <div className="pt-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2f6a4c]">
                  {data.date} · {data.total} 条
                </p>
                <h2 className="font-display mt-3 text-[28px] leading-[1.2] tracking-[-0.01em] text-[#14291d] sm:text-[36px]">
                  今日 AI 动态
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526b5d]">
                  由站内科技与 AI 来源自动汇总，每 5 分钟更新一次。
                </p>

                <div className="mt-8">
                  {data.sections.map(section => (
                    <section key={section.label} className="mb-9 last:mb-0">
                      <SectionLabel label={section.label} count={section.items.length} />
                      <div>
                        {section.items.map(entry => <Entry key={entry.url} entry={entry} />)}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}
    </div>
  )
}
