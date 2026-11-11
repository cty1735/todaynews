import type { NewsItem, SourceID, SourceResponse } from "@shared/types"
import { featuredSourceIds } from "@shared/metadata"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion, useInView } from "framer-motion"
import { useWindowSize } from "react-use"
import { forwardRef, useImperativeHandle } from "react"
import { OverlayScrollbar } from "../common/overlay-scrollbar"
import { safeParseString } from "~/utils"

export interface ItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  id: SourceID
  /**
   * 是否显示透明度，拖动时原卡片的样式
   */
  isDragging?: boolean
  setHandleRef?: (ref: HTMLElement | null) => void
}

interface NewsCardProps {
  id: SourceID
  setHandleRef?: (ref: HTMLElement | null) => void
}

const featuredSources = new Set<SourceID>(featuredSourceIds)

export const CardWrapper = forwardRef<HTMLElement, ItemsProps>(({ id, isDragging, setHandleRef, style, ...props }, dndRef) => {
  const ref = useRef<HTMLDivElement>(null)
  const isFeatured = featuredSources.has(id)

  const inView = useInView(ref, {
    once: true,
  })

  useImperativeHandle(dndRef, () => ref.current! as HTMLDivElement)

  return (
    <div
      ref={ref}
      data-source={id}
      className={$(
        "flex flex-col h-500px rounded-md p-4 cursor-default transition-colors-200",
        isFeatured
          ? "relative border border-[#a9cdb2] bg-gradient-to-b from-[#e9f4e3] to-[#fbfdf8] shadow-[0_14px_28px_-24px_rgba(31,107,71,0.95)] hover:border-[#5f9a7a]"
          : "border border-[#c9dcc9] bg-[#fbfdf8] hover:border-[#9fbea6]",
        isDragging && "op-40",
      )}
      style={{
        transformOrigin: "50% 50%",
        ...style,
      }}
      {...props}
    >
      {isFeatured && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-md bg-gradient-to-r from-[#1f6b47] via-[#4f9a6d] to-[#c9a227]" aria-hidden="true" />
      )}
      {inView && <NewsCard id={id} setHandleRef={setHandleRef} />}
    </div>
  )
})

function NewsCard({ id, setHandleRef }: NewsCardProps) {
  const { refresh } = useRefetch()
  const { data, isFetching, isError } = useQuery({
    queryKey: ["source", id],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1] as SourceID
      const force = refetchSources.delete(id)
      const url = `/s?id=${id}&latest${force ? "&force=1" : ""}`
      const headers: Record<string, any> = {}
      if (force) {
        const jwt = safeParseString(localStorage.getItem("jwt"))
        if (jwt) headers.Authorization = `Bearer ${jwt}`
      } else if (cacheSources.has(id) && Date.now() - Number(cacheSources.get(id)!.updatedTime) < 120_000) {
        // wait animation
        await delay(200)
        return cacheSources.get(id)
      }

      const response: SourceResponse = await myFetch(url, {
        headers,
      })

      function diff() {
        try {
          if (response.items && sources[id].type === "hottest" && cacheSources.has(id)) {
            response.items.forEach((item, i) => {
              const o = cacheSources.get(id)!.items.findIndex(k => k.id === item.id)
              item.extra = {
                ...item?.extra,
                diff: o === -1 ? undefined : o - i,
              }
            })
          }
        } catch (e) {
          console.error(e)
        }
      }

      diff()

      cacheSources.set(id, response)
      return response
    },
    placeholderData: prev => prev,
    staleTime: 120_000,
    refetchInterval: 120_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
  })

  const { isFocused, toggleFocus } = useFocusWith(id)
  const isFeatured = featuredSources.has(id)

  return (
    <>
      <div className={$(
        "flex justify-between mb-3 pb-3 items-start border-b",
        isFeatured ? "border-[#bfd9bf]" : "border-[#e0eae0]",
      )}
      >
        <div className="flex min-w-0 gap-2.5 items-center">
          <a
            className={$("w-7 h-7 shrink-0 rounded-full bg-cover ring-1 ring-black/5")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${sources[id].name}官网`}
            href={sources[id].home?.startsWith("/") ? withBase(sources[id].home) : sources[id].home}
            title={sources[id].desc}
            style={{
              backgroundImage: `url(${withBase(`icons/${id.split("-")[0]}.png`)})`,
            }}
          />
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2">
              <span
                className={$(
                  "truncate text-lg tracking-tight",
                  isFeatured ? "font-bold text-[#12402a]" : "font-semibold",
                )}
                title={sources[id].desc}
              >
                {sources[id].name}
              </span>
              {isFeatured && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#1f6b47] px-1.5 py-0.5 text-[10px] leading-none text-white" title="重点来源，已置顶">
                  <span className="i-ph:push-pin-fill text-[10px]" aria-hidden="true" />
                  置顶
                </span>
              )}
              {sources[id]?.title && <span className={$("shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#2f6a4c]")}>{sources[id].title}</span>}
            </span>
            <span className="font-mono text-[10px] text-[#7c9381]"><UpdatedTime isError={isError} updatedTime={data?.updatedTime} /></span>
          </span>
        </div>
        <div className={$("flex shrink-0 gap-0.5 text-[15px] text-[#2f6a4c]")}>
          <button
            type="button"
            aria-label={`刷新${sources[id].name}`}
            title={`刷新${sources[id].name}`}
            className={$("cursor-pointer rounded-full p-1 transition-colors-200 hover:bg-[#e6f0e2]", isFetching && "animate-spin")}
            onClick={() => refresh(id)}
          >
            <span className={$("block", isFetching ? "i-ph:circle-dashed-duotone" : "i-ph:arrow-counter-clockwise-duotone")} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`${isFocused ? "取消关注" : "关注"}${sources[id].name}`}
            aria-pressed={isFocused}
            title={isFocused ? "取消关注" : "关注"}
            className={$("cursor-pointer rounded-full p-1 transition-colors-200 hover:bg-[#e6f0e2]")}
            onClick={toggleFocus}
          >
            <span className={$("block", isFocused ? "i-ph:star-fill" : "i-ph:star-duotone")} aria-hidden="true" />
          </button>
          {/* firefox cannot drag a button */}
          {setHandleRef && (
            <div
              ref={setHandleRef}
              className={$("cursor-grab rounded-full p-1 transition-colors-200 hover:bg-[#e6f0e2]")}
              title="拖动排序"
            >
              <span className="i-ph:dots-six-vertical-duotone block" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <OverlayScrollbar
        className={$([
          "h-full overflow-y-auto pr-1",
          isFetching && `animate-pulse`,
        ])}
        options={{
          overflow: { x: "hidden" },
        }}
        defer
      >
        <div className={$("transition-opacity-300", isFetching && "op-40")}>
          {!!data?.items?.length && (sources[id].type === "hottest" ? <NewsListHot items={data.items} /> : <NewsListTimeLine items={data.items} />)}
          {!data?.items?.length && !isFetching && (
            <div className="flex flex-col items-center gap-3 py-12 text-sm text-[#6c8371]" role="status">
              <span>{isError ? "暂时无法获取该来源" : "暂无新闻"}</span>
              <button type="button" className="cursor-pointer rounded-md border border-[#c9dcc9] px-3 py-1.5 text-xs text-[#2f6a4c] transition-colors-200 hover:bg-[#eaf2e5]" onClick={() => refresh(id)}>重新获取</button>
            </div>
          )}
        </div>
      </OverlayScrollbar>
    </>
  )
}

function UpdatedTime({ isError, updatedTime }: { updatedTime: any, isError: boolean }) {
  const relativeTime = useRelativeTime(updatedTime ?? "")
  if (isError) return "获取失败"
  if (relativeTime) return `${relativeTime}更新`
  return "加载中..."
}

function DiffNumber({ diff }: { diff: number }) {
  const [shown, setShown] = useState(true)
  useEffect(() => {
    setShown(true)
    const timer = setTimeout(() => {
      setShown(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [setShown, diff])

  return (
    <AnimatePresence>
      { shown && (
        <motion.span
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 0.5, y: -7 }}
          exit={{ opacity: 0, y: -15 }}
          className={$("text-[9px] leading-none", diff < 0 ? "text-[#2f8f5b]" : "text-[#b4533c]")}
        >
          {diff > 0 ? `+${diff}` : diff}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
function ExtraInfo({ item }: { item: NewsItem }) {
  if (item?.extra?.info) {
    return <>{item.extra.info}</>
  }
  if (item?.extra?.icon) {
    const { url, scale } = typeof item.extra.icon === "string" ? { url: item.extra.icon, scale: undefined } : item.extra.icon
    return (
      <img
        src={url}
        alt=""
        style={{
          transform: `scale(${scale ?? 1})`,
        }}
        className="h-3.5 inline align-[-2px]"
        referrerPolicy="no-referrer"
        onError={e => e.currentTarget.style.display = "none"}
      />
    )
  }
}

function NewsUpdatedTime({ date }: { date: string | number }) {
  const relativeTime = useRelativeTime(date)
  return <>{relativeTime}</>
}
function NewsListHot({ items }: { items: NewsItem[] }) {
  const { width } = useWindowSize()
  return (
    <ol className="flex flex-col">
      {items?.map((item, i) => (
        <a
          href={width < 768 ? item.mobileUrl || item.url : item.url}
          target="_blank"
          rel="noopener noreferrer"
          key={item.id}
          title={item.extra?.hover}
          className={$(
            "group flex gap-2.5 items-start cursor-pointer border-b border-[#e7efe7] py-2.5 pr-1 transition-colors-200 last:border-0",
            "hover:border-[#c9dcc9] hover:bg-[#f4f9f0] visited:(text-[#8aa091])",
          )}
        >
          <span className="flex w-6 shrink-0 flex-col items-start gap-0.5 pt-0.5">
            <span className="font-mono text-[10px] leading-none text-[#8aa091] transition-colors-200 group-hover:text-[#1f6b47]">
              {String(i + 1).padStart(2, "0")}
            </span>
            {!!item.extra?.diff && <DiffNumber diff={item.extra.diff} />}
          </span>
          <span className="min-w-0 flex-1 text-[14px] leading-snug transition-colors-200 group-hover:text-[#1f6b47]">
            {item.title}
          </span>
          <span className="shrink-0 pt-0.5 text-right text-[10px] text-[#8aa091]">
            <ExtraInfo item={item} />
          </span>
        </a>
      ))}
    </ol>
  )
}

function NewsListTimeLine({ items }: { items: NewsItem[] }) {
  const { width } = useWindowSize()
  return (
    <ol className="relative ml-1 border-l border-[#d7e4d7]">
      {items?.map(item => (
        <li key={`${item.id}-${item.pubDate || item?.extra?.date || ""}`} className="relative pb-3 pl-3 last:pb-0">
          <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#b7cdb9]" />
          <span className="flex items-center gap-1 font-mono text-[10px] text-[#8aa091]">
            {(item.pubDate || item?.extra?.date) && <NewsUpdatedTime date={(item.pubDate || item?.extra?.date)!} />}
            <ExtraInfo item={item} />
          </span>
          <a
            className={$(
              "mt-0.5 block cursor-pointer rounded pr-1 text-[14px] leading-snug text-[#1b3325] transition-colors-200",
              "hover:bg-[#f4f9f0] hover:text-[#1f6b47] visited:(text-[#8aa091])",
            )}
            href={width < 768 ? item.mobileUrl || item.url : item.url}
            title={item.extra?.hover}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  )
}
