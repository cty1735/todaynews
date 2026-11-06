import { motion } from "framer-motion"

// function ThemeToggle() {
//   const { isDark, toggleDark } = useDark()
//   return (
//     <li onClick={toggleDark} className="cursor-pointer [&_*]:cursor-pointer transition-all">
//       <span className={$("inline-block", isDark ? "i-ph-moon-stars-duotone" : "i-ph-sun-dim-duotone")} />
//       <span>
//         {isDark ? "浅色模式" : "深色模式"}
//       </span>
//     </li>
//   )
// }

export function Menu() {
  const { loggedIn, login, logout, userInfo, enableLogin } = useLogin()
  const { toggle } = useSearchBar()
  const { ok: canGoTop, fn: goToTop } = useAtomValue(goToTopAtom)
  const [shown, show] = useState(false)
  return (
    <span
      className="relative"
      onBlur={event => !event.currentTarget.contains(event.relatedTarget) && show(false)}
      onKeyDown={event => event.key === "Escape" && show(false)}
    >
      <span className="flex items-center scale-90">
        {
          enableLogin && loggedIn && userInfo.avatar
            ? (
                <button
                  type="button"
                  aria-label="打开菜单"
                  aria-expanded={shown}
                  aria-controls="dropdown-menu"
                  onClick={() => show(!shown)}
                  className="h-6 w-6 rounded-full bg-cover"
                  style={
                    {
                      backgroundImage: `url(${userInfo.avatar}&s=24)`,
                    }
                  }
                >
                </button>
              )
            : <button type="button" aria-label="打开菜单" aria-expanded={shown} aria-controls="dropdown-menu" onClick={() => show(!shown)} className="btn i-si:more-muted-horiz-circle-duotone" />
        }
      </span>
      {shown && (
        <div className="absolute right-0 z-99 bg-transparent pt-4 top-4">
          <motion.div
            id="dropdown-menu"
            className={$([
              "w-220px",
              "border border-[#c9dcc9] bg-[#fbfdf8] backdrop-blur-md rounded-md shadow-lg shadow-emerald-950/10",
            ])}
            initial={{
              scale: 0.9,
            }}
            animate={{
              scale: 1,
            }}
          >
            <ol className="p-2 rounded-md color-base text-sm">
              {enableLogin && (loggedIn
                ? (
                    <li><button type="button" onClick={logout}>
                      <span className="i-ph:sign-out-duotone inline-block" />
                      <span>退出登录</span>
                    </button></li>
                  )
                : (
                    <li><button type="button" onClick={login}>
                      <span className="i-ph:sign-in-duotone inline-block" />
                      <span>Github 账号登录</span>
                    </button></li>
                  ))}
              <li>
                <button type="button" onClick={() => { show(false); toggle(true) }}>
                  <span className="i-ph:plus-circle-duotone inline-block" />
                  <span>添加新闻来源</span>
                </button>
              </li>
              {canGoTop && (
                <li>
                  <button type="button" onClick={() => { show(false); goToTop?.() }}>
                    <span className="i-ph:arrow-fat-up-duotone inline-block" />
                    <span>回到顶部</span>
                  </button>
                </li>
              )}
              {/* <ThemeToggle /> */}
              <li><a href={Homepage} target="_blank" rel="noopener noreferrer" className="cursor-pointer [&_*]:cursor-pointer transition-all">
                <span className="i-ph:github-logo-duotone inline-block" />
                <span>Star on Github </span>
              </a></li>
              <li className="flex gap-2 items-center">
                <a
                  href="https://github.com/cty1735/todaynews"
                >
                  <img
                    alt="GitHub stars badge"
                    src="https://img.shields.io/github/stars/cty1735/todaynews?logo=github&style=flat&labelColor=%23123D2A&color=%232F8F5B"
                  />
                </a>
                <a
                  href="https://github.com/cty1735/todaynews/fork"
                >
                  <img
                    alt="GitHub forks badge"
                    src="https://img.shields.io/github/forks/cty1735/todaynews?logo=github&style=flat&labelColor=%23123D2A&color=%232F8F5B"
                  />
                </a>
              </li>
            </ol>
          </motion.div>
        </div>
      )}
    </span>
  )
}
