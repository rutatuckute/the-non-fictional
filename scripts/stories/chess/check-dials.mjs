// Checks the reader's four dials (src/components/stories/chess/dials.js)
// against the author's own games, measured in Python with the story's rules
// (analysis/export_dials_reference.py in the data-stories repository):
// - the same games are kept (rated ten-minute standard games, 20 plies or more);
// - in each, the same side, result, first three moves, and the same forcing and
//   fast-move counts as style_all.record(), exactly;
// - her dials since the switch match dials_mine.csv: contact, pace and
//   persistence exactly, habit (an average of random 30-game draws) within 0.01;
// - her recognition curve, run here as a reader's is run in the browser
//   (curveOf), lies within 0.05 of the one in choose.json at every point.
//
//   node scripts/stories/chess/check-dials.mjs <personal_games.json.gz> <dials_reference.json>
//
// Both files are in the data-stories repository (chess-story/data).

import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"

import { curveOf, dialsOf, habitDrawn, random, readGame, threeOf } from "../../../src/components/stories/chess/dials.js"

const [file, refFile] = process.argv.slice(2)
if (!file || !refFile) {
  console.error("usage: node scripts/stories/chess/check-dials.mjs <personal_games.json.gz> <dials_reference.json>")
  process.exit(2)
}
const games = JSON.parse(gunzipSync(readFileSync(file)))
const ref = JSON.parse(readFileSync(refFile))
const ME = "the-non-fictional"
const problems = []

const kept = new Map()
for (const g of games) {
  const row = readGame(g, ME)
  if (row) kept.set(g.uuid, row)
}
for (const uuid of Object.keys(ref.games)) if (!kept.has(uuid)) problems.push(`${uuid}: kept in Python, not here`)
for (const uuid of kept.keys()) if (!(uuid in ref.games)) problems.push(`${uuid}: kept here, not in Python`)

let same = 0
for (const [uuid, want] of Object.entries(ref.games)) {
  const got = kept.get(uuid)
  if (!got) continue
  const diffs = []
  if (got.white !== (want.side === "w")) diffs.push("side")
  if (got.seq !== want.seq) diffs.push(`seq ${JSON.stringify(got.seq)} vs ${JSON.stringify(want.seq)}`)
  if (got.loss !== ["resigned", "checkmated", "timeout", "abandoned"].includes(want.res)) diffs.push("loss")
  if (got.gave !== ["resigned", "abandoned"].includes(want.res)) diffs.push("gave")
  if (got.rating !== want.rating) diffs.push("rating")
  for (const k of ["f", "fn", "fast", "tn"]) if (got[k] !== want.record[k]) diffs.push(`${k} ${got[k]} vs ${want.record[k]}`)
  if (diffs.length) problems.push(`${uuid}: ${diffs.join(", ")}`)
  else same++
}

// her dials since the switch
const since = Object.entries(ref.games)
  .filter(([uuid, g]) => g.start >= ref.switch && kept.has(uuid))
  .map(([uuid]) => kept.get(uuid))
const [contact, pace, persistence] = threeOf(since)
const habit30 = habitDrawn(since, 30, 2000, random(2026))
const want = ref.since
const near = (a, b, tol) => Math.abs(a - b) <= tol
if (!near(contact, want.contact, 1e-12)) problems.push(`contact since the switch: ${contact} here, ${want.contact} in Python`)
if (!near(pace, want.pace, 1e-12)) problems.push(`pace since the switch: ${pace} here, ${want.pace} in Python`)
if (!near(persistence, want.persistence, 1e-12)) problems.push(`persistence since the switch: ${persistence} here, ${want.persistence} in Python`)
if (!near(habit30, want.habit30, 0.01)) problems.push(`habit since the switch: ${habit30.toFixed(4)} here, ${want.habit30.toFixed(4)} in Python`)

// her curve, the reader's way
const site = new URL("../../../src/components/stories/chess/", import.meta.url)
const P = JSON.parse(readFileSync(new URL("choose-peers.json", site)))
const story = JSON.parse(readFileSync(new URL("choose.json", site)))
const curve = await curveOf(since, dialsOf(since, P, 1).rating, P, 2, { trials: 1000 })
curve.forEach((v, i) => {
  if (!near(v, story.curves.her[i], 0.05)) problems.push(`her curve at ${P.ns[i]} games: ${v} here, ${story.curves.her[i]} in choose.json`)
})

console.log(`${Object.keys(ref.games).length} games in Python, ${kept.size} here, ${same} identical.`)
console.log(`Her curve, the reader's way: ${curve.map(v => Math.round(v * 100)).join(" ")} (choose.json ${story.curves.her.map(v => Math.round(v * 100)).join(" ")}).`)
console.log(`Since the switch (${since.length} games): contact ${contact.toFixed(4)}, pace ${pace.toFixed(4)}, persistence ${persistence.toFixed(4)}, habit ${habit30.toFixed(4)} (Python ${want.habit30.toFixed(4)}).`)
if (problems.length) {
  console.log(`${problems.length} problem(s):`)
  for (const p of problems.slice(0, 40)) console.log(" ", p)
  process.exit(1)
}
console.log("All match.")
