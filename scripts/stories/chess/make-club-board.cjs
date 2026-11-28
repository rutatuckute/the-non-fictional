// node make-club-board.cjs <sharp dir> <out dir> <empty-board.png> <original-board.png>
// The club's board with nothing on it, for the page to set the pieces on. It
// is cut to the box that holds both it and the original picture (the one with
// the pieces set up, whose black pieces stand out above the board's far edge),
// so it sits in the scene exactly where the original did. Faint specks (alpha
// under 48) are dropped. Written as WebP at 1000 and 600 px wide, and the
// squares' edges are measured from the result and printed, in its own pixels
// at 1000 wide: the ranks' edges (8 at the top to 1), and each file's edges
// half way down every rank (the files converge towards the far side).
const sharp = require(process.argv[2])
const [out, empty, original] = process.argv.slice(3)
const box = async file => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let [l, t, r, b] = [info.width, info.height, 0, 0]
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 120) [l, t, r, b] = [Math.min(l, x), Math.min(t, y), Math.max(r, x), Math.max(b, y)]
  return [l, t, r, b]
}
;(async () => {
  const [a, b] = [await box(empty), await box(original)]
  const cut = { left: Math.min(a[0], b[0]), top: Math.min(a[1], b[1]) }
  cut.width = Math.max(a[2], b[2]) - cut.left + 1
  cut.height = Math.max(a[3], b[3]) - cut.top + 1
  const { data, info } = await sharp(empty).ensureAlpha().extract(cut).raw().toBuffer({ resolveWithObject: true })
  for (let i = 3; i < data.length; i += 4) if (data[i] < 48) data[i] = 0
  const clean = await sharp(data, { raw: info }).png().toBuffer()
  for (const [suffix, width] of [["", 1000], ["-600", 600]]) {
    const file = `${out}/club-board-empty${suffix}.webp`
    await sharp(clean).resize({ width }).webp({ quality: 80, alphaQuality: 90 }).toFile(file)
    const m = await sharp(file).metadata()
    console.log(file.split("/").pop(), m.width, m.height, `${Math.round(require("fs").statSync(file).size / 1024)} KB`)
  }
  // the squares, from the picture as written
  const made = await sharp(`${out}/club-board-empty.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = made.info.width
  const H = made.info.height
  const kind = (x, y) => {
    const k = (y * W + x) * 4
    if (made.data[k + 3] < 128) return "_"
    return made.data[k] - made.data[k + 1] > 50 ? "P" : "W"
  }
  const runs = (get, n) => {
    const found = []
    let before = null
    let start = 0
    for (let i = 0; i <= n; i++) {
      const now = i < n ? get(i) : null
      if (now !== before) {
        if (before !== null) found.push([before, start, i - 1])
        before = now
        start = i
      }
    }
    return found
  }
  // ranks: down two neighbouring files near the middle, where pink and white alternate
  const down = x => runs(y => kind(x, y), H).filter(run => run[0] !== "_" && run[2] - run[1] > 30)
  const edges = new Set()
  // (the c and d files: between them every rank's pink square is met, clear of the lines between files)
  for (const x of [Math.round(W * 0.36), Math.round(W * 0.45)]) for (const run of down(x)) if (run[0] === "P") { edges.add(run[1]); edges.add(run[2] + 1) }
  const all = [...edges].sort((p, q) => p - q)
  const Y = all.filter((y, i) => i === 0 || y - all[i - 1] > 8)
  console.log("Y", JSON.stringify(Y))
  const X = []
  for (let r = 0; r + 1 < Y.length; r++) {
    const y = Math.round((Y[r] + Y[r + 1]) / 2)
    const across = runs(x => kind(x, y), W).filter(run => run[0] !== "_" && run[2] - run[1] > 40)
    // more than eight runs: the outer ones are the board's border, the shorter end first
    while (across.length > 8) {
      const first = across[0][2] - across[0][1]
      const last = across[across.length - 1][2] - across[across.length - 1][1]
      if (first < last) across.shift()
      else across.pop()
    }
    X.push([across[0][1], ...across.map(run => run[2] + 1)])
  }
  console.log("X", JSON.stringify(X))
})()
