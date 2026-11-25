// "When things go wrong", for the reader: how often they lost their queen
// like the players in the sample, and what they did next. Read in their
// browser from Chess.com's public data, only when they ask: the list of months
// they played (/pub/player/<name>/games/archives), then one month at a time,
// newest first (/pub/player/<name>/games/YYYY/MM). Each month comes with every
// game in full; of those, only counts are kept, in memory, for this reading.
// Nothing is sent to the site, stored, or put in the address bar.
//
// The rules are the sample's, ported line for line so the reader's numbers
// compare like with like (scripts/stories/chess/check-queens.mjs checks this
// against the author's games, case by case):
// - queen_loss_all.py: in each game, the first queen lost from a roughly even
//   position (material within 2) that stays lost: two half-moves after the
//   capture its side is still 6 or more down (so trades don't count);
// - ideas_build.classify: resigned within 5 half-moves = resigned at once;
//   abandoned, or lost on time with a minute or more left, within 5 half-moves
//   = left; anything else = played on. Saved = won, drew or stalemate.
// Rapid games only, standard chess from the usual start, as the sample's.

import { USERNAME } from "./chesscom.js"

// At least this many lost queens before there is anything to compare.
export const MIN_CASES = 10
// How far back: the last 12 months, at most 1,000 rapid games, and no more
// than 5,000 games of any kind read (a month of bullet can be thousands).
const MONTHS_BACK = 12
const MAX_RAPID = 1000
const MAX_READ = 5000
const TIMEOUT = 20000

// The sample's rating bands (ideas_build.BANDS), in wrong-paths.json's byLevel order.
const EDGES = [400, 600, 800, 1000, 1200, 1500, 2000]
export const bandOf = rating => {
  const i = EDGES.findIndex(e => rating < e)
  return i < 0 ? EDGES.length : i
}

const DRAWS = new Set(["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"])
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

// ── Moves: Chess.com's compact encoding of a game (its "tcn"), two characters
// a move. Squares are 0–63 (a1 = 0, b1 = 1, … h8 = 63); a promotion's second
// character gives the piece and the file it goes to instead of a square.
const TCN = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?{~}(^)[_]@#$,./&-*++="
const PROMOTE = "qnrb"
export const decode = tcn => {
  const moves = []
  for (let i = 0; i + 1 < tcn.length; i += 2) {
    const from = TCN.indexOf(tcn[i])
    let to = TCN.indexOf(tcn[i + 1])
    let promo = null
    if (from < 0 || to < 0 || from > 63) return null // (drops belong to variants)
    if (to > 63) {
      promo = PROMOTE[Math.floor((to - 64) / 3)]
      if (!promo) return null
      to = from + (from < 16 ? -8 : 8) + ((to - 1) % 3) - 1
    }
    moves.push([from, to, promo])
  }
  return moves
}

// ── The board, as 64 squares holding FEN letters (upper case White).
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const startBoard = () => {
  const b = Array(64).fill(null)
  "RNBQKBNR".split("").forEach((p, f) => {
    b[f] = p
    b[8 + f] = "P"
    b[48 + f] = "p"
    b[56 + f] = p.toLowerCase()
  })
  return b
}
// Plays one move; false when it cannot be right (no piece to move).
const play = (b, [from, to, promo]) => {
  const piece = b[from]
  if (!piece) return false
  const kind = piece.toLowerCase()
  const white = piece === piece.toUpperCase()
  // castling: the king goes two squares (or onto its own rook), the rook jumps over
  const own = b[to] && (b[to] === b[to].toUpperCase()) === white
  if (kind === "k" && (Math.abs(to - from) === 2 || (own && b[to].toLowerCase() === "r"))) {
    const rank = from - (from % 8)
    const short = to % 8 > from % 8
    b[from] = null
    b[short ? rank + 7 : rank] = null
    b[rank + (short ? 6 : 2)] = piece
    b[rank + (short ? 5 : 3)] = white ? "R" : "r"
    return true
  }
  // en passant: a pawn goes sideways onto an empty square, taking the pawn beside it
  if (kind === "p" && from % 8 !== to % 8 && !b[to]) b[from - (from % 8) + (to % 8)] = null
  b[to] = promo ? (white ? promo.toUpperCase() : promo) : piece
  b[from] = null
  return true
}
// White's material minus Black's, and how many queens each side has.
const weigh = b => {
  let balance = 0
  let wq = 0
  let bq = 0
  for (const p of b) {
    if (!p) continue
    const white = p === p.toUpperCase()
    const kind = p.toLowerCase()
    balance += white ? VALUE[kind] : -VALUE[kind]
    if (kind === "q") white ? wq++ : bq++
  }
  return [balance, wq, bq]
}
// The position after all the moves, as a FEN's first field (null if they cannot be played).
export const finalPlacement = moves => {
  const board = startBoard()
  for (const move of moves) if (!play(board, move)) return null
  return placement(board)
}
const placement = b => {
  const rows = []
  for (let r = 7; r >= 0; r--) {
    let row = ""
    let empty = 0
    for (let f = 0; f < 8; f++) {
      const p = b[r * 8 + f]
      if (!p) empty++
      else {
        if (empty) row += empty
        row += p
        empty = 0
      }
    }
    rows.push(row + (empty || ""))
  }
  return rows.join("/")
}

// ── Clocks: the time each player had left after each move, from the PGN's
// [%clk] notes, one list entry per half-move (null where there is none).
const CLOCK = /%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)/
const TOKEN = /\{([^}]*)\}|\([^)]*\)|\d+\.+|1-0|0-1|1\/2-1\/2|\*|\$\d+|[^\s{}()]+/g
export const clocksOf = pgn => {
  const text = String(pgn || "")
    .split("\n")
    .filter(line => !/^\s*\[/.test(line))
    .join(" ")
  const clocks = []
  for (const m of text.matchAll(TOKEN)) {
    const token = m[0]
    if (m[1] != null) {
      const clk = CLOCK.exec(m[1])
      if (clk && clocks.length) clocks[clocks.length - 1] = Number(clk[1]) * 3600 + Number(clk[2]) * 60 + Number(clk[3])
    } else if (!/^(\d+\.+|1-0|0-1|1\/2-1\/2|\*|\$\d+|\(.*)$/.test(token)) clocks.push(null)
  }
  return clocks
}

// ── One game: the first queen lost and kept lost, or null (queen_loss_all.case).
// moves from decode(), clocks from clocksOf(); returns null too when the game
// cannot be replayed.
export const queenCase = (moves, clocks) => {
  const board = startBoard()
  const bal = [0]
  const wq = [1]
  const bq = [1]
  for (const move of moves) {
    if (!play(board, move)) return null
    const [m, w, k] = weigh(board)
    bal.push(m)
    wq.push(w)
    bq.push(k)
  }
  const n = moves.length
  const moverWhite = k => k % 2 === 0
  const lastClock = (white, upto) => {
    for (let k = Math.min(upto, n - 1); k >= 0; k--) if (moverWhite(k) === white && clocks[k] != null) return clocks[k]
    return null
  }
  for (let i = 0; i < n; i++) {
    if (Math.abs(bal[i]) > 2) continue
    const later = Math.min(i + 3, n)
    for (const white of [true, false]) {
      const q = white ? wq : bq
      if (q[i] === 1 && q[i + 1] === 0) {
        const own = white ? bal[later] : -bal[later]
        if (own <= -6) return { white, ply: i + 1, move: Math.floor(i / 2) + 1, after: n - (i + 1), clock: lastClock(white, i), deficit: -own }
      }
    }
    if (wq[i] === 0 && bq[i] === 0) return null
  }
  return null
}

// What the player who lost the queen did, and how it ended (ideas_build.classify).
export const classify = (lost, result) => {
  const early = lost.after <= 5
  let decision = "on"
  if (early && result === "resigned") decision = "resigned"
  else if (early && (result === "abandoned" || (result === "timeout" && (lost.clock ?? 0) >= 60))) decision = "left"
  const end =
    result === "win" ? "won" : result === "stalemate" ? "stalemate" : DRAWS.has(result) ? "drew" : result === "checkmated" ? "mated" : result === "timeout" ? "flagged" : result === "resigned" ? "resigned" : "other"
  return { decision, end, saved: end === "won" || end === "stalemate" || end === "drew" }
}

// A game as Chess.com's archive gives it, from the side of `username`: the
// reader's own lost queen in it, classified, or null. `rapid` false lets the
// check script use other time classes.
export const readGame = (game, username, rapid = true) => {
  if (!game || game.rules !== "chess" || (rapid && game.time_class !== "rapid")) return null
  if (game.initial_setup && game.initial_setup !== START) return null
  const white = String(game.white?.username || "").toLowerCase() === username.toLowerCase()
  const black = String(game.black?.username || "").toLowerCase() === username.toLowerCase()
  if (white === black) return null
  const moves = typeof game.tcn === "string" ? decode(game.tcn) : null
  if (!moves) return null
  const lost = queenCase(moves, clocksOf(game.pgn))
  if (!lost || lost.white !== white) return null
  const me = white ? game.white : game.black
  return { ...lost, ...classify(lost, me.result), rating: me.rating, result: me.result }
}

// The reader's counts, from their cases; `byLevel` is wrong-paths.json's
// queen.byLevel (how often players who stayed at each rating were saved).
export const tally = (cases, byLevel) => {
  const on = cases.filter(x => x.decision === "on")
  const expected = on.reduce((sum, x) => sum + (byLevel[bandOf(x.rating)]?.saved ?? 0), 0)
  return {
    cases: cases.length,
    resigned: cases.filter(x => x.decision === "resigned").length,
    left: cases.filter(x => x.decision === "left").length,
    on: on.length,
    saved: on.filter(x => x.saved).length,
    won: on.filter(x => x.end === "won").length,
    drew: on.filter(x => x.end === "drew" || x.end === "stalemate").length,
    expected: Math.round(expected * 10) / 10,
  }
}

const get = async (url, signal) => {
  const timer = new AbortController()
  const stop = () => timer.abort()
  signal?.addEventListener("abort", stop)
  const clock = setTimeout(stop, TIMEOUT)
  try {
    const response = await fetch(url, { signal: timer.signal, credentials: "omit", referrerPolicy: "no-referrer", headers: { Accept: "application/json" } })
    if (response.status === 404 || response.status === 410) return { status: "missing" }
    if (response.status === 429) return { status: "busy" }
    if (!response.ok) return { status: "unreachable" }
    return { status: "ok", data: await response.json() }
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: "unreachable" }
  } finally {
    clearTimeout(clock)
    signal?.removeEventListener("abort", stop)
  }
}

// Counts the reader's lost queens. Returns { kind: "counted", username, games,
// since, ...tally } or { kind: "few" (fewer than MIN_CASES), "none" (no rapid
// games), "missing", "busy", "unreachable", "invalid", ... }. onMonth(date,
// done, of) reports progress. Never throws, except when aborted by the caller.
export const countQueens = async (typed, byLevel, signal, onMonth = () => {}) => {
  const username = String(typed || "").trim()
  if (!USERNAME.test(username)) return { kind: "invalid", username }
  const base = `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games`
  const list = await get(`${base}/archives`, signal)
  if (list.status !== "ok") return { kind: list.status, username }
  // only months, as YYYY/MM; the addresses are built here, not followed
  const now = new Date()
  const oldest = now.getUTCFullYear() * 12 + now.getUTCMonth() - (MONTHS_BACK - 1)
  const months = (Array.isArray(list.data?.archives) ? list.data.archives : [])
    .map(url => /\/games\/(\d{4})\/(\d{2})$/.exec(String(url)))
    .filter(Boolean)
    .map(([, y, m]) => [Number(y), Number(m)])
    .filter(([y, m]) => m >= 1 && m <= 12 && y * 12 + m - 1 >= oldest)
    .sort((a, b) => b[0] - a[0] || b[1] - a[1])
  const cases = []
  let rapid = 0
  let read = 0
  let since = null
  for (let i = 0; i < months.length && rapid < MAX_RAPID && read < MAX_READ; i++) {
    const [y, m] = months[i]
    onMonth(Date.UTC(y, m - 1, 1), i, months.length)
    const month = await get(`${base}/${y}/${String(m).padStart(2, "0")}`, signal)
    if (month.status === "busy" || month.status === "unreachable") return { kind: month.status, username }
    if (month.status !== "ok") continue
    // newest first, so the cap keeps the most recent games
    const games = (Array.isArray(month.data?.games) ? month.data.games : []).slice().sort((a, b) => (b?.end_time || 0) - (a?.end_time || 0))
    read += games.length
    for (const game of games) {
      if (rapid >= MAX_RAPID) break
      if (game?.rules !== "chess" || game?.time_class !== "rapid") continue
      rapid++
      if (Number.isInteger(game.end_time)) since = game.end_time * 1000
      const found = readGame(game, username)
      if (found) cases.push(found)
    }
  }
  if (!rapid) return { kind: "none", username }
  const counts = tally(cases, byLevel)
  if (counts.cases < MIN_CASES) return { kind: "few", username, games: rapid, cases: counts.cases }
  return { kind: "counted", username, games: rapid, since, ...counts }
}
