import { createFileRoute } from "@tanstack/react-router"
import { Column } from "~/components/column"

export const Route = createFileRoute("/")({
  component: IndexComponent,
})

// 关注列默认没内容，落地页固定最热
function IndexComponent() {
  return <Column id="hottest" />
}
