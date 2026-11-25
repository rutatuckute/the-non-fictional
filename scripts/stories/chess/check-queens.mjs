// Checks the reader's queen count (src/components/stories/chess/queens.js)
// against the author's own games, counted in Python with the sample's rules
// (analysis/export_wrong_her.py). Every count must match wrong-paths.json's
// "her" exactly, for her lost queens and for her opponents'.
//
//   node scripts/stories/chess/check-queens.mjs <personal_games.json.gz> [reference.json]
//
// personal_games.json.gz is in the data-stories repo (chess-story/data). The
// optional reference.json maps each game's uuid to queen_loss_all.case's result
// ({white, ply, after, clock, deficit} or null), to compare game by game.
// Also checks, for every game, that replaying Chess.com's move encoding ends on
// the position Chess.com gives, and that every move has its clock.

import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"

import { clocksOf, decode, finalPlacement, queenCase, readGame, tally } from "../../../src/components/stories/chess/queens.js"

const paths = JSON.parse(readFileSync(new URL("../../../src/components/stories/chess/wrong-paths.json", import.meta.url)))
const [file, refFile] = process.argv.slice(2)
if (!file) {
  console.error("usage: node scripts/stories/chess/check-queens.mjs <personal_games.json.gz> [reference.json]")
  process.exit(2)
}
const games = JSON.parse(gunzipSync(readFileSync(file)))
const ref = refFile ? JSON.parse(readFileSync(refFile)) : null
const ME = "the-non-fictional"
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
const problems = []

let replayed = 0
let compared = 0
for (const g of games) {
  if (g.rules !== "chess" || (g.initial_setup && g.initial_setup !== START)) continue
  const moves = decode(g.tcn || "")
  if (!moves) {
    problems.push(`${g.uuid}: moves cannot be decoded`)
    continue
  }
  const end = finalPlacement(moves)
  if (end !== String(g.fen).split(" ")[0]) problems.push(`${g.uuid}: replay ends on ${end}, Chess.com says ${g.fen}`)
  const clocks = clocksOf(g.pgn)
  if (clocks.length !== moves.length) problems.push(`${g.uuid}: ${moves.length} moves but ${clocks.length} in the PGN`)
  replayed++
  if (ref && g.uuid in ref) {
    const want = ref[g.uuid]
    const got = queenCase(moves, clocks)
    const same =
      (want === null && got === null) ||
      (want && got && want.white === got.white && want.ply === got.ply && want.after === got.after && want.deficit === got.deficit && (want.clock ?? null) === (got.clock ?? null))
    if (!same) problems.push(`${g.uuid}: Python ${JSON.stringify(want)}, here ${JSON.stringify(got)}`)
    compared++
  }
}

// Her rapid games up to the story's cut-off, from her side and from her opponents'.
const until = Date.parse(`${paths.her.until}T00:00:00Z`) / 1000 + 86400
const rapid = games.filter(g => g.rules === "chess" && g.time_class === "rapid" && g.end_time < until)
const mine = []
const theirs = []
for (const g of rapid) {
  const white = g.white.username.toLowerCase() === ME
  const me = readGame(g, ME)
  if (me) mine.push(me)
  const them = readGame(g, (white ? g.black : g.white).username)
  if (them) theirs.push(them)
}
const her = tally(mine, paths.queen.byLevel)
const want = paths.her.queen
for (const key of ["cases", "resigned", "left", "on", "saved", "won", "drew"]) {
  if (her[key] !== want[key]) problems.push(`her queens, ${key}: ${her[key]} here, ${want[key]} in wrong-paths.json`)
}
const stalemates = mine.filter(x => x.decision === "on" && x.end === "stalemate").length
if (stalemates !== want.stalemate) problems.push(`her queens, stalemate: ${stalemates} here, ${want.stalemate} in wrong-paths.json`)
const opp = {
  cases: theirs.length,
  resignedAtOnce: theirs.filter(x => x.decision === "resigned").length,
  resignedAny: theirs.filter(x => x.result === "resigned").length,
  left: theirs.filter(x => x.decision === "left").length,
  on: theirs.filter(x => x.decision === "on").length,
  escaped: theirs.filter(x => x.decision === "on" && x.saved).length,
}
for (const [key, value] of Object.entries(opp)) {
  if (value !== paths.her.opponents[key]) problems.push(`her opponents' queens, ${key}: ${value} here, ${paths.her.opponents[key]} in wrong-paths.json`)
}

console.log(`${replayed} games replayed${ref ? `, ${compared} compared with Python game by game` : ""}`)
console.log(`her rapid games to ${paths.her.until}: ${rapid.length}`)
console.log("her queens:", { ...her, stalemate: stalemates }, "(players at her level would have saved, by band alone:", her.expected, ")")
console.log("her opponents' queens:", opp)
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`)
  for (const p of problems.slice(0, 40)) console.log(" ", p)
  process.exit(1)
}
console.log("\nall match")
