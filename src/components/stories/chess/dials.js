// "What our choices reveal", for the reader: their four dials and their own
// recognition game, from their Chess.com games, in their browser. The games
// are the ones the lost-queen count reads (queens.js readRapid: rapid games of
// the last 12 months, at most 1,000), read only when the reader asks; of them,
// the rated ten-minute games are used. Nothing is sent anywhere or stored.
//
// Ported line for line from the data-stories repository, so the reader is
// measured exactly as the players in the story are
// (scripts/stories/chess/check-dials.mjs checks this, game by game, against
// the author's games counted in Python):
// - which games: dials_mine.py (standard chess, rated, 10 minutes with no
//   increment, at least 20 plies);
// - per game: style_all.record() (contact: of the player's moves 5 to 25, the
//   share that check, capture or threaten a piece that is undefended or worth
//   more than the mover; pace: of their moves from move 8 on, made with a
//   minute or more on the clock, the share made in under 2 seconds);
// - persistence: of the games lost, the share not resigned or abandoned;
// - habit: the share of games in the most common first three moves, per
//   colour (as Black, White's first move too), over draws of 30 games;
// - the game: export_recognition_mock.py (30 known games make the card; the
//   mystery games are drawn from the rest; nine players within 75 rating
//   points; the computer takes the card with the smallest gaps).
// The units, the other players' cards and the players behind "above N in 100"
// are choose-peers.json (export_choose.py), loaded only when needed.

import { clocksOf, decode, play, readRapid, startBoard } from "./queens.js"

export const K = 30 // games on a card
export const MIN_DIALS = 30 // ten-minute games for the dials (the floor of the players in the story)
export const FIND_N = 5 // mystery games in "find you", as in "find me"
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

// ── Attacks on the board of queens.js (64 squares of FEN letters, a1 = 0).
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const white = p => p === p.toUpperCase()
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
const AROUND = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
const STRAIGHT = AROUND.filter(([a, b]) => !a || !b)
const DIAGONAL = AROUND.filter(([a, b]) => a && b)
// The squares the piece on `sq` attacks (python-chess's board.attacks).
const attacks = (b, sq) => {
  const p = b[sq]
  const kind = p.toLowerCase()
  const f = sq % 8
  const r = sq >> 3
  const out = []
  const step = ([df, dr]) => {
    const nf = f + df
    const nr = r + dr
    if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) out.push(nr * 8 + nf)
  }
  const ray = ([df, dr]) => {
    for (let nf = f + df, nr = r + dr; nf >= 0 && nf < 8 && nr >= 0 && nr < 8; nf += df, nr += dr) {
      out.push(nr * 8 + nf)
      if (b[nr * 8 + nf]) break
    }
  }
  if (kind === "p") [[-1, white(p) ? 1 : -1], [1, white(p) ? 1 : -1]].forEach(step)
  else if (kind === "n") KNIGHT.forEach(step)
  else if (kind === "k") AROUND.forEach(step)
  else {
    if (kind !== "b") STRAIGHT.forEach(ray)
    if (kind !== "r") DIAGONAL.forEach(ray)
  }
  return out
}
// Whether a piece of the side `byWhite` attacks `sq` (python-chess's board.attackers, pins ignored).
const attacked = (b, byWhite, sq) => {
  for (let s = 0; s < 64; s++) if (b[s] && white(b[s]) === byWhite && attacks(b, s).includes(sq)) return true
  return false
}

// ── One game, from one side: style_all.record(). moves from decode(), clocks
// from clocksOf(); null when the player made fewer than 10 moves or the game
// cannot be replayed.
export const record = (moves, clocks, asWhite) => {
  const b = startBoard()
  const r = { f: 0, fn: 0, fast: 0, tn: 0 }
  let mine = 0
  let prev = null
  for (let i = 0; i < moves.length; i++) {
    const [from, to0] = moves[i]
    const mover = i % 2 === 0
    const piece = b[from]
    if (!piece) return null
    if (mover !== asWhite) {
      play(b, moves[i])
      continue
    }
    mine++
    const n = (i >> 1) + 1
    const kind = piece.toLowerCase()
    // castling (two squares, or onto its own rook): the king lands on g or c
    const ownRook = b[to0] && white(b[to0]) === mover && b[to0].toLowerCase() === "r"
    const castle = kind === "k" && (Math.abs(to0 - from) === 2 || ownRook)
    const to = castle ? from - (from % 8) + (to0 % 8 > from % 8 ? 6 : 2) : to0
    const capture = !castle && ((b[to] && white(b[to]) !== mover) || (kind === "p" && from % 8 !== to % 8 && !b[to]))
    play(b, moves[i])
    const king = b.findIndex(p => p === (mover ? "k" : "K"))
    const check = king >= 0 && attacked(b, mover, king)
    if (n >= 5 && n <= 25) {
      const value = VAL[b[to].toLowerCase()]
      let threat = false
      for (const s of attacks(b, to)) {
        const q = b[s]
        if (!q || white(q) === mover || q.toLowerCase() === "k") continue
        if (VAL[q.toLowerCase()] > value || !attacked(b, !mover, s)) {
          threat = true
          break
        }
      }
      r.fn += 1
      r.f += check || capture || threat ? 1 : 0
    }
    const clock = clocks[i]
    if (clock != null) {
      if (n >= 8 && prev != null && prev >= 60) {
        r.tn += 1
        r.fast += Math.max(0, prev - clock) < 2 ? 1 : 0
      }
      prev = clock
    }
  }
  return mine < 10 ? null : r
}

// The moves as the PGN writes them, as dials_mine.py reads them (for the habit).
const RESULTS = new Set(["1-0", "0-1", "1/2-1/2"])
export const sanOf = pgn =>
  String(pgn || "")
    .replace(/^[\s\S]*\n\n/, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/[0-9]+\.+/g, "")
    .split(/\s+/)
    .filter(x => x && !RESULTS.has(x))

const LOSS = new Set(["resigned", "checkmated", "timeout", "abandoned"])
const GAVE = new Set(["resigned", "abandoned"])
// A game as Chess.com's archive gives it, from the side of `username`: what
// the dials need of it, or null when it is not one of the games they use.
export const readGame = (game, username) => {
  if (!game || game.rules !== "chess" || game.time_control !== "600" || game.rated === false) return null
  if (game.initial_setup && game.initial_setup !== START) return null
  const asWhite = String(game.white?.username || "").toLowerCase() === username.toLowerCase()
  const asBlack = String(game.black?.username || "").toLowerCase() === username.toLowerCase()
  if (asWhite === asBlack) return null
  const san = sanOf(game.pgn)
  if (san.length < 20) return null
  const moves = typeof game.tcn === "string" ? decode(game.tcn) : null
  if (!moves) return null
  const r = record(moves, clocksOf(game.pgn), asWhite)
  if (!r) return null
  const me = asWhite ? game.white : game.black
  return {
    ...r,
    white: asWhite,
    seq: asWhite ? `${san[0]} ${san[2]} ${san[4]}` : `${san[0]} | ${san[1]} ${san[3]} ${san[5]}`,
    loss: LOSS.has(me.result),
    gave: GAVE.has(me.result),
    rating: Number(me.rating) || null,
  }
}

// ── A list of games, summed (export_recognition_mock.three and .habit).
export const threeOf = games => {
  let f = 0, fn = 0, fast = 0, tn = 0, loss = 0, gave = 0
  for (const g of games) {
    f += g.f
    fn += g.fn
    fast += g.fast
    tn += g.tn
    loss += g.loss
    gave += g.gave
  }
  return [f / fn, tn > 0 ? fast / tn : NaN, loss > 0 ? 1 - gave / loss : NaN]
}
export const habitOf = games => {
  let top = 0
  let tot = 0
  for (const side of [true, false]) {
    const count = new Map()
    let most = 0
    for (const g of games) {
      if (g.white !== side) continue
      const c = (count.get(g.seq) || 0) + 1
      count.set(g.seq, c)
      if (c > most) most = c
    }
    if (count.size) {
      top += most
      tot += [...count.values()].reduce((a, b) => a + b, 0)
    }
  }
  return top / tot
}

// A repeatable random number generator, so a reader sees the same numbers each time.
export const random = seed => {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const seedOf = text => [...text].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261)
// k of the list, without putting back
const draw = (list, k, rand) => {
  const a = list.slice()
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rand() * (a.length - i))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, k)
}
const shuffle = (list, rand) => draw(list, list.length, rand)
// habit over draws of k games (dials_mine.habit_draw, averaged)
export const habitDrawn = (games, k, times, rand) => {
  let sum = 0
  for (let i = 0; i < times; i++) sum += habitOf(draw(games, k, rand))
  return sum / times
}

// ── The unit of the story: a dial's value as spreads from the average player.
const zThree = (t, U) => t.map((v, k) => (Number.isFinite(v) ? (v - U.mu3[k]) / U.sd3[k] : NaN))
const zHabit = (h, ni, U) => (h != null && U.sdH[ni] > 1e-9 ? (h - U.muH[ni]) / U.sdH[ni] : NaN)
const zvec = (t, h, ni, U) => [...zThree(t, U), zHabit(h, ni, U)]
const cardOf = (row, ni) => row.slice(1, 4).map(v => (v == null ? NaN : v)).concat(row[4 + ni] == null ? NaN : row[4 + ni])
// The computer's pick: the card with the smallest gaps, over the dials every card and the mystery games have.
export const pick = (cards, mystery) => {
  const avail = mystery.map((m, k) => Number.isFinite(m) && cards.every(c => Number.isFinite(c[k])))
  const used = avail.filter(Boolean).length
  let best = 0
  let bestD = Infinity
  const d = cards.map((c, i) => {
    let sq = 0
    c.forEach((v, k) => avail[k] && (sq += (v - mystery[k]) ** 2))
    const dist = Math.sqrt((sq * 4) / used)
    if (dist < bestD) {
      bestD = dist
      best = i
    }
    return dist
  })
  return { pick: best, d }
}
// nine players near a rating (within 75 points, wider only when there are too few)
const near = (profiles, rating, rand) => {
  for (let reach = 75; ; reach *= 2) {
    const c = profiles.filter(p => Math.abs(p[0] - rating) <= reach)
    if (c.length >= 9 || reach > 3000) return draw(c, Math.min(9, c.length), rand)
  }
}

// ── The reader's dials at their level, like hers on the strips: the dials in
// the story's unit, "above N in 100" among players within 150 rating points
// (wider when they are few), what is typical there, how far from it.
const finite = v => (v == null ? NaN : v)
const median = v => {
  const s = v.filter(Number.isFinite).sort((a, b) => a - b)
  if (!s.length) return NaN
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const quantile = (v, q) => {
  const s = v.filter(Number.isFinite).sort((a, b) => a - b)
  return s[Math.floor(q * (s.length - 1))]
}
const distance = (row, med) => {
  let sum = 0
  let n = 0
  row.forEach((v, k) => {
    if (Number.isFinite(v) && Number.isFinite(med[k])) {
      sum += (v - med[k]) ** 2
      n++
    }
  })
  return n ? Math.sqrt(sum / n) : NaN
}
export const placeOf = (z, rating, P) => {
  let reach = 150
  let band = P.peers.filter(p => Math.abs(p[0] - rating) <= reach)
  while (band.length < 200 && reach < 600) {
    reach += 75
    band = P.peers.filter(p => Math.abs(p[0] - rating) <= reach)
  }
  const cloud = band.map(p => p.slice(1).map(finite))
  const med = [0, 1, 2, 3].map(k => median(cloud.map(p => p[k])))
  const above = z.map((v, k) => {
    const vals = cloud.map(p => p[k]).filter(Number.isFinite)
    return Number.isFinite(v) && vals.length ? Math.round((100 * vals.filter(x => x < v).length) / vals.length) : null
  })
  const middle = [0, 1, 2, 3].map(k => [quantile(cloud.map(p => p[k]), 0.25), quantile(cloud.map(p => p[k]), 0.75)])
  const outside = z.filter((v, k) => Number.isFinite(v) && (v < middle[k][0] || v > middle[k][1])).length
  const me = distance(z, med)
  const ds = cloud.map(p => distance(p, med)).filter(Number.isFinite)
  const round10 = v => Math.round(v / 10) * 10
  return {
    band: [round10(Math.max(100, rating - reach)), round10(rating + reach)],
    peers: band.length,
    median: med,
    above,
    outside,
    distAbove: Math.round((100 * ds.filter(d => d < me).length) / ds.length),
  }
}

// The reader's dials, from their games (at least MIN_DIALS of them).
export const dialsOf = (games, P, seed) => {
  const rand = random(seed)
  const rating = games.reduce((s, g) => s + (g.rating || 0), 0) / games.length
  const I30 = P.ns.indexOf(30)
  const habit30 = habitDrawn(games, K, 500, rand)
  const z = [...zThree(threeOf(games), P), zHabit(habit30, I30, P)]
  return { rating, z, ...placeOf(z, rating, P) }
}

// "Find you": the reader's card (30 of their games) among nine players near
// their rating, and FIND_N of their other games as the mystery. Not chosen to
// work: the computer may miss.
export const findYou = (games, rating, P, seed) => {
  const rand = random(seed)
  const ni = P.ns.indexOf(FIND_N)
  const all = shuffle(games, rand)
  const known = all.slice(0, K)
  const mix = all.slice(K, K + FIND_N)
  const mine = zvec(threeOf(known), habitDrawn(known, FIND_N, 30, rand), ni, P)
  const others = near(P.profiles, rating, rand).map(p => cardOf(p, ni))
  const order = shuffle([...others.keys(), -1], rand) // card position -> -1 (the reader) or another player
  const cards = order.map(i => (i < 0 ? mine : others[i]))
  const mystery = zvec(threeOf(mix), mix.length > 1 ? habitOf(mix) : null, ni, P)
  const show = v => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null)
  return { n: FIND_N, truth: order.indexOf(-1), pick: pick(cards, mystery).pick, cards: cards.map(c => c.map(show)), mystery: mystery.map(show) }
}

// The reader's curve: how often the computer picks them out of ten, by games
// seen, over `trials` games at each n (as the stand-in reader of the mock).
// Points need 30 known games and n more, so with fewer than 60 games the curve
// stops early (null). Runs a little at a time; onPoint(i, value) as it goes.
export const curveOf = async (games, rating, P, seed, { trials = 1000, signal, onPoint = () => {} } = {}) => {
  const rand = random(seed)
  const out = P.ns.map(() => null)
  for (let ni = 0; ni < P.ns.length; ni++) {
    const n = P.ns[ni]
    if (games.length < K + n) break
    let hit = 0
    for (let t = 0; t < trials; t++) {
      const all = shuffle(games, rand)
      const known = all.slice(0, K)
      const mix = all.slice(K, K + n)
      const cards = [zvec(threeOf(known), habitDrawn(known, n, 30, rand), ni, P), ...near(P.profiles, rating, rand).map(p => cardOf(p, ni))]
      const mystery = zvec(threeOf(mix), mix.length > 1 ? habitOf(mix) : null, ni, P)
      if (pick(cards, mystery).pick === 0) hit++
      if (t % 100 === 99) {
        await new Promise(done => setTimeout(done, 0))
        if (signal?.aborted) return out
      }
    }
    out[ni] = Math.round((hit / trials) * 1000) / 1000
    onPoint(ni, out[ni])
  }
  return out
}

// Reads the reader's games and places them on the dials. Returns { kind:
// "read", username, games, since, rating, z, above, ... , find } or { kind:
// "few" (fewer than MIN_DIALS ten-minute games), "missing", "busy",
// "unreachable", "invalid", username }. The rows of games stay in `rows`, for
// curveOf. Never throws, except when aborted by the caller.
export const readDials = async (typed, signal, onMonth) => {
  const read = await readRapid(typed, signal, onMonth)
  if (read.kind !== "ok") return { kind: read.kind, username: read.username }
  const { username } = read
  const rows = read.games.map(g => readGame(g, username)).filter(Boolean)
  if (rows.length < MIN_DIALS) return { kind: "few", username, games: rows.length }
  const P = (await import("./choose-peers.json")).default
  if (signal?.aborted) throw new DOMException("aborted", "AbortError")
  const seed = seedOf(`${username.toLowerCase()}:${rows.length}`)
  const dials = dialsOf(rows, P, seed)
  const find = rows.length >= K + FIND_N ? findYou(rows, dials.rating, P, seed + 1) : null
  return { kind: "read", username, games: rows.length, since: read.since, ...dials, find, rows, P, seed }
}
