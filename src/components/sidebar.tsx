import { Link } from "@tanstack/react-router"
import { Brand } from "./brand"

const navLabels: Record<string, string> = {
  focus: "关注",
  hottest: "最热",
  realtime: "实时",
  updated: "更新",
}

function scrollToSource(id: string) {
  document.querySelector<HTMLElement>(`main [data-source="${id}"]`)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  })
}

export function Sidebar() {
  const currentColumnID = useAtomValue(currentColumnIDAtom)
  const currentSources = useAtomValue(currentSourcesAtom)
  const { toggle } = useSearchBar()

  const date = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  return (
    <aside className="hidden h-full w-264px shrink-0 flex-col border-r border-[#d7e3d7] bg-[#f8fbf5] px-5 py-6 lg:flex">
      <Brand />
      <p className="mt-4 flex items-center gap-2 font-mono text-[10px] tracking-wide text-[#6c8371]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3f9c6d]" />
        {date}
        <span className="ml-auto">本地版</span>
      </p>

      <nav className="mt-7" aria-label="栏目">
        <p className="mb-2 px-2 text-[11px] text-[#7c9381]">栏目</p>
        <div className="flex flex-col gap-0.5">
          {fixedColumnIds.map(columnId => (
            <Link
              key={columnId}
              to="/c/$column"
              params={{ column: columnId }}
              className={$(
                "flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors-200",
                currentColumnID === columnId
                  ? "bg-[#e4efe2] font-semibold text-[#1f6b47]"
                  : "text-[#3d5748] hover:bg-[#edf4e9] hover:text-[#1f6b47]",
              )}
            >
              {navLabels[columnId] ?? metadata[columnId].name}
              {currentColumnID === columnId && <span className="h-1.5 w-1.5 rounded-full bg-[#3f9c6d]" />}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mt-7 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] text-[#7c9381]">来源 · {currentSources.length}</p>
        </div>
        <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
          {currentSources.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSource(id)}
              title={`定位到${sources[id].name}`}
              className="group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors-200 hover:bg-[#eaf2e5]"
            >
              <span
                className="h-5 w-5 shrink-0 rounded-full bg-cover ring-1 ring-black/5"
                style={{ backgroundImage: `url(/icons/${id.split("-")[0]}.png)` }}
              />
              <span className="truncate text-[12px] text-[#3d5748] group-hover:text-[#1f6b47]">{sources[id].name}</span>
              <span className="ml-auto text-[10px] text-[#a2b5a6] opacity-0 transition-opacity-200 group-hover:opacity-100">定位</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => toggle(true)}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-[#b9cfb9] py-2 text-xs text-[#2f6a4c] transition-colors-200 hover:border-[#8db39a] hover:bg-[#eaf2e5]"
        >
          <span className="i-ph:plus" aria-hidden="true" />
          添加新闻来源
        </button>
      </div>

      <p className="mt-4 border-t border-[#dfe9df] pt-4 font-mono text-[10px] text-[#839889]">
        <a href={`${Homepage}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="hover:text-[#1f6b47]">
          MIT 许可证
        </a>
        <span className="mx-1.5">·</span>
        <a href={Author.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#1f6b47]">
          {Author.name}
        </a>
      </p>
    </aside>
  )
}