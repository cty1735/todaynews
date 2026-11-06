export function Footer() {
  return (
    <>
      <a href={`${Homepage}/blob/main/LICENSE`} target="_blank">MIT LICENSE</a>
      <span>
        <span>TodayNews © 2024 By </span>
        <a href={Author.url} target="_blank" rel="noopener noreferrer">
          {Author.name}
        </a>
      </span>
    </>
  )
}
