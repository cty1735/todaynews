import { Link } from "@tanstack/react-router"

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="TodayNews 首页">
      <img
        src="/icon.svg"
        alt=""
        className={$(small ? "h-7 w-7" : "h-10 w-10", "shrink-0 transition-transform-300 group-hover:-rotate-3")}
      />
      <span className="flex flex-col">
        <span className={$(small ? "text-xl" : "text-[27px]", "font-display leading-none tracking-[-0.045em] text-[#14291d]")}>
          Today<span className="italic text-[#1f6b47]">News</span>
        </span>
        {!small && (
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#6c8371]">
            实时新闻聚合
          </span>
        )}
      </span>
    </Link>
  )
}