import { useIsFetching, useQueryClient } from "@tanstack/react-query"
import type { SourceID } from "@shared/types"
import { Brand } from "../brand"
import { Menu } from "./menu"
import { MobileNav } from "../navbar"
import { currentColumnIDAtom, currentSourcesAtom } from "~/atoms"

function Refresh() {
  const currentColumnID = useAtomValue(currentColumnIDAtom)
  const currentSources = useAtomValue(currentSourcesAtom)
  const { refresh } = useRefetch()
  const queryClient = useQueryClient()
  const isAi = currentColumnID === "ai"
  const refreshAll = useCallback(() => {
    if (isAi)
      return queryClient.invalidateQueries({ queryKey: ["aihot"] })
    refresh(...currentSources)
  }, [refresh, currentSources, isAi, queryClient])

  const isFetching = useIsFetching({
    predicate: (query) => {
      if (isAi)
        return query.queryKey[0] === "aihot"
      const [type, id] = query.queryKey as ["source" | "entire", SourceID]
      return (type === "source" && currentSources.includes(id)) || type === "entire"
    },
  })

  return (
    <button
      type="button"
      title="刷新当前栏目"
      aria-label="刷新当前栏目"
      className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#2f6a4c] transition-colors-200 hover:bg-[#e6f0e2] hover:text-[#1f6b47]"
      onClick={refreshAll}
    >
      <span className={$("i-ph:arrow-counter-clockwise-duotone text-base", isFetching && "animate-spin i-ph:circle-dashed-duotone")} aria-hidden="true" />
      <span className="hidden sm:inline">刷新</span>
    </button>
  )
}

function Search() {
  const { toggle } = useSearchBar()
  return (
    <button
      type="button"
      title="搜索新闻来源"
      aria-label="搜索新闻来源"
      className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#2f6a4c] transition-colors-200 hover:bg-[#e6f0e2] hover:text-[#1f6b47]"
      onClick={() => toggle(true)}
    >
      <span className="i-ph:magnifying-glass-duotone text-base" aria-hidden="true" />
      <span className="hidden sm:inline">搜索来源</span>
      <kbd className="ml-1 hidden rounded border border-[#cbdccb] bg-white/60 px-1 py-0.5 font-mono text-[9px] text-[#7c9381] md:inline">Ctrl K</kbd>
    </button>
  )
}

export function TopBar() {
  const currentColumnID = useAtomValue(currentColumnIDAtom)
  const currentSources = useAtomValue(currentSourcesAtom)

  return (
    <header className="sticky top-0 z-20 border-b border-[#d7e3d7] bg-[#f2f6ed]/95 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-2.5 lg:px-8 lg:py-4">
        <span className="lg:hidden">
          <Brand small />
        </span>

        <div className="hidden flex-col lg:flex">
          <p className="text-[11px] text-[#7c9381]">实时新闻聚合</p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-[#14291d]">
              {metadata[currentColumnID].name}
            </h1>
            <p className="font-mono text-[10px] text-[#7c9381]">
              {currentColumnID === "ai"
                ? "AI 日报与免费额度 · 来自 AIHOT"
                : `${currentSources.length} 个来源 · 每 2 分钟检查更新`}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Refresh />
          <Search />
          <span className="mx-1 hidden h-4 w-px bg-[#d7e3d7] sm:block" />
          <Menu />
        </div>
      </div>
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </header>
  )
}