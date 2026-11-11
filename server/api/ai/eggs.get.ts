import { eggGroups, eggUpdatedAt } from "#/utils/ai-eggs"

export default defineEventHandler(() => ({ updatedAt: eggUpdatedAt, groups: eggGroups }))
