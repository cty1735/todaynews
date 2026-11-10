import { getAiDigest } from "#/utils/ai-digest"

export default defineEventHandler(async () => await getAiDigest())
