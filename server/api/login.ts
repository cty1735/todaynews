import process from "node:process"

export default defineEventHandler(async (event) => {
  if (!process.env.G_CLIENT_ID) {
    // 未配置 GitHub OAuth 时不要把用户送去 client_id=undefined 的死链接
    throw createError({ statusCode: 506, message: "Server not configured, login disabled" })
  }
  sendRedirect(event, `https://github.com/login/oauth/authorize?client_id=${process.env.G_CLIENT_ID}`)
})
