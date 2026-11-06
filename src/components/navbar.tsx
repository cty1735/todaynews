import { Link } from "@tanstack/react-router"
import { fixedColumnIds, metadata } from "@shared/metadata"
import { currentColumnIDAtom } from "~/atoms"

export function MobileNav() {
  const currentId = useAtomValue(currentColumnIDAtom)
  const { toggle } = useSearchBar()

  return (
    <nav className="scrollbar-hidden flex items-center gap-5 overflow-x-auto px-4 pb-2" aria-label="栏目">
      {fixedColumnIds.map(columnId => (
        <Link
          key={columnId}
          to="/c/$column"
          params={{ column: columnId }}
          className={$(
            "shrink-0 whitespace-nowrap border-b-2 pb-1 text-[13px] transition-colors-200",
            currentId === columnId
              ? "border-[#1f6b47] font-semibold text-[#1f6b47]"
              : "border-transparent text-[#6c8371] hover:text-[#1f6b47]",
          )}
        >
          {metadata[columnId].name}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => toggle(true)}
        className="ml-auto flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap pb-1 text-[13px] text-[#2f6a4c]"
      >
        <span className="i-ph:plus" aria-hidden="true" />
        来源
      </button>
    </nav>
  )
}