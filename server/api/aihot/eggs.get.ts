import { getEggData } from "#/utils/aihot"

export default defineEventHandler(async () => {
  return await getEggData()
})
