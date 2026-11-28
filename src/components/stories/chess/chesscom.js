// The reader's own Chess.com ratings, read in their browser from Chess.com's
// public data (https://www.chess.com/news/view/published-data-api). One
// request, only when the reader asks: /pub/player/<name>/stats. Of what comes
// back, only the current rapid and bullet ratings, their dates, and the
// number of games in each are kept, in memory, for this reading. Nothing is
// sent to the site, stored, or put in the address bar.

// Chess.com usernames: 3 to 25 letters, digits, hyphens or underscores.
export const USERNAME = /^[A-Za-z0-9_-]{3,25}$/

// The same floor as the players in the chart: at least 20 games in each format.
export const MIN_GAMES = 20

const TIMEOUT = 10000
const RATING = v => Number.isInteger(v) && v >= 100 && v <= 4000
const COUNT = v => (Number.isInteger(v) && v >= 0 ? v : 0)

// One format from the stats response, or null when it is missing or odd.
const format = entry => {
  const rating = entry?.last?.rating
  if (!RATING(rating)) return null
  const record = entry.record || {}
  const date = Number.isInteger(entry.last.date) && entry.last.date > 0 ? entry.last.date * 1000 : null
  return { rating, date, games: COUNT(record.win) + COUNT(record.loss) + COUNT(record.draw) }
}

// { kind: "found", username, rapid, bullet } with each format as
// { rating, date, games }, or { kind: "invalid" | "missing" | "thin" | "busy" |
// "unreachable", ... }. Never throws, except when aborted by the caller.
export const lookUp = async (typed, signal) => {
  const username = String(typed || "").trim()
  if (!USERNAME.test(username)) return { kind: "invalid", username }
  const timer = new AbortController()
  const stop = () => timer.abort()
  signal?.addEventListener("abort", stop)
  const clock = setTimeout(stop, TIMEOUT)
  try {
    const response = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/stats`, {
      signal: timer.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { Accept: "application/json" },
    })
    if (response.status === 404 || response.status === 410) return { kind: "missing", username }
    if (response.status === 429) return { kind: "busy", username }
    if (!response.ok) return { kind: "unreachable", username }
    const stats = await response.json()
    const rapid = format(stats?.chess_rapid)
    const bullet = format(stats?.chess_bullet)
    if (!rapid || !bullet || rapid.games < MIN_GAMES || bullet.games < MIN_GAMES) {
      const short = [!rapid || rapid.games < MIN_GAMES ? "rapid" : null, !bullet || bullet.games < MIN_GAMES ? "bullet" : null].filter(Boolean)
      return { kind: "thin", username, short }
    }
    return { kind: "found", username, rapid, bullet }
  } catch (error) {
    if (signal?.aborted) throw error
    return { kind: "unreachable", username }
  } finally {
    clearTimeout(clock)
    signal?.removeEventListener("abort", stop)
  }
}
