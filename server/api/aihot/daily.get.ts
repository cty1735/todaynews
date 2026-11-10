import { getDailyData } from "#/utils/aihot"

export default defineEventHandler(async () => {
  return await getDailyData()
})
