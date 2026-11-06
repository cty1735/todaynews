import type { PropsWithChildren } from "react"
import type { SourceID } from "@shared/types"
import type { BaseEventPayload, ElementDragType } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types"
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge"
import { createPortal } from "react-dom"
import { useThrottleFn } from "ahooks"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { motion } from "framer-motion"
import { useWindowSize } from "react-use"
import { isMobile } from "react-device-detect"
import { DndContext } from "../common/dnd"
import { useSortable } from "../common/dnd/useSortable"
import { OverlayScrollbar } from "../common/overlay-scrollbar"
import type { ItemsProps } from "./card"
import { CardWrapper } from "./card"
import { currentColumnIDAtom, currentSourcesAtom } from "~/atoms"

const AnimationDuration = 200
const WIDTH = 420
export function Dnd() {
  const [items, setItems] = useAtom(currentSourcesAtom)
  const currentColumnID = useAtomValue(currentColumnIDAtom)
  const sortable = currentColumnID === "focus"
  const [parent] = useAutoAnimate({ duration: AnimationDuration })
  useEntireQuery(items)
  const { width } = useWindowSize()
  const { toggle } = useSearchBar()
  const minWidth = useMemo(() => {
    // double padding = 32
    return Math.min(width - 32, WIDTH)
  }, [width])

  if (!items.length) return (
    <div className="mx-auto flex max-w-420px flex-col items-center gap-3 rounded-md border border-dashed border-[#b9cfb9] bg-white/50 px-6 py-16 text-center">
      <p className="text-sm text-[#526b5d]">还没有关注的新闻来源</p>
      <p className="text-xs text-[#8aa091]">从来源索引里挑几个，版面就会出现在这里。</p>
      <button
        type="button"
        className="mt-2 cursor-pointer rounded-md bg-[#1f6b47] px-4 py-2 text-sm text-white transition-colors-200 hover:bg-[#18573a]"
        onClick={() => toggle(true)}
      >
        添加新闻来源
      </button>
    </div>
  )

  return (
    <DndWrapper items={items} setItems={setItems} isSingleColumn={isMobile} sortable={sortable}>
      <OverlayScrollbar defer className="overflow-x-auto">
        <motion.ol
          className={isMobile
            ? "scrollbar-hidden flex snap-x snap-mandatory gap-3 px-1 pb-4 scroll-smooth"
            : "grid w-full gap-4 lg:gap-5"}
          ref={parent}
          style={isMobile
            ? {
                // 横向滚动布局
              }
            : {
                gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
              }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {
              opacity: 0,
            },
            visible: {
              opacity: 1,
              transition: {
                delayChildren: 0.05,
                staggerChildren: 0.06,
              },
            },
          }}
        >
          {items.map((id, index) => (
            <motion.li
              key={id}
              className={$(isMobile && "flex-shrink-0 snap-center", isMobile && index === items.length - 1 && "mr-2")}
              style={isMobile ? { width: `${width - 40 > WIDTH ? WIDTH : width - 40}px` } : undefined}
              transition={{
                type: "tween",
                duration: AnimationDuration / 1000,
              }}
              variants={{
                hidden: {
                  y: 12,
                  opacity: 0,
                },
                visible: {
                  y: 0,
                  opacity: 1,
                },
              }}
            >
              <SortableCardWrapper id={id} sortable={sortable} />
            </motion.li>
          ))}
        </motion.ol>
      </OverlayScrollbar>
      {isMobile && (
        <div className="flex justify-center">
          <span className="pb-1 text-xs text-[#7c9381]">左右滑动查看更多</span>
        </div>
      )}
    </DndWrapper>
  )
}

function DndWrapper({ items, setItems, isSingleColumn, sortable, children }: PropsWithChildren<{
  items: SourceID[]
  setItems: (items: SourceID[]) => void
  isSingleColumn: boolean
  sortable: boolean
}>) {
  const onDropTargetChange = useCallback(({ location, source }: BaseEventPayload<ElementDragType>) => {
    const traget = location.current.dropTargets[0]
    if (!traget?.data || !source?.data) return
    const closestEdgeOfTarget = extractClosestEdge(traget.data)
    const fromIndex = items.indexOf(source.data.id as SourceID)
    const toIndex = items.indexOf(traget.data.id as SourceID)
    if (fromIndex === toIndex || fromIndex === -1 || toIndex === -1) return
    const update = reorderWithEdge({
      list: items,
      startIndex: fromIndex,
      indexOfTarget: toIndex,
      closestEdgeOfTarget,
      axis: isSingleColumn ? "horizontal" : "vertical",
    })
    setItems(update)
  }, [items, setItems, isSingleColumn])
  // 避免动画干扰
  const { run } = useThrottleFn(onDropTargetChange, {
    leading: true,
    trailing: true,
    wait: AnimationDuration,
  })
  const { el } = useAtomValue(goToTopAtom)
  if (!sortable) return children

  return (
    <DndContext onDropTargetChange={run} autoscroll={el ? { element: el } : undefined}>
      {children}
    </DndContext>
  )
}

function CardOverlay({ id }: { id: SourceID }) {
  return (
    <div className={$(
      "flex flex-col p-4 backdrop-blur-5",
      "border border-[#b9cfb9] bg-[#fbfdf8] shadow-lg shadow-emerald-950/10",
      !isiOS() && "rounded-md",
    )}
    >
      <div className={$("flex justify-between mx-2 items-center")}>
        <div className="flex gap-2 items-center">
          <div
            className={$("w-8 h-8 rounded-full bg-cover")}
            style={{
              backgroundImage: `url(${withBase(`icons/${id.split("-")[0]}.png`)})`,
            }}
          />
          <span className="flex flex-col">
            <span className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {sources[id].name}
              </span>
              {sources[id]?.title && <span className={$("font-mono text-[10px] uppercase tracking-wider text-[#2f6a4c]")}>{sources[id].title}</span>}
            </span>
            <span className="text-xs op-70">拖拽中</span>
          </span>
        </div>
        <div className={$("flex gap-2 text-lg text-emerald-700")}>
          <button
            type="button"
            className={$("i-ph:dots-six-vertical-duotone", "cursor-grabbing")}
          />
        </div>
      </div>
    </div>
  )
}

function SortableCardWrapper({ id, sortable }: ItemsProps & { sortable: boolean }) {
  const {
    isDragging,
    setNodeRef,
    setHandleRef,
    OverlayContainer,
  } = useSortable({ id })

  useEffect(() => {
    if (OverlayContainer) {
      OverlayContainer!.className += $(`bg-[#fbfdf8]`, !isiOS() && "rounded-md")
    }
  }, [OverlayContainer])

  return (
    <>
      <CardWrapper
        ref={setNodeRef}
        id={id}
        isDragging={isDragging}
        setHandleRef={sortable ? setHandleRef : undefined}
      />
      {OverlayContainer && createPortal(<CardOverlay id={id} />, OverlayContainer)}
    </>
  )
}
