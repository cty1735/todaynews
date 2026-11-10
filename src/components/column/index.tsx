import type { FixedColumnID } from "@shared/types"
import { useTitle } from "react-use"
import { Dnd } from "./dnd"
import { AiColumn } from "../ai"
import { currentColumnIDAtom } from "~/atoms"

export function Column({ id }: { id: FixedColumnID }) {
  const [currentColumnID, setCurrentColumnID] = useAtom(currentColumnIDAtom)
  useEffect(() => {
    setCurrentColumnID(id)
  }, [id, setCurrentColumnID])

  useTitle(`TodayNews | ${metadata[id].name}`)

  if (id === "ai")
    return <AiColumn />

  return (
    <>
      {id === currentColumnID && <Dnd />}
    </>
  )
}
