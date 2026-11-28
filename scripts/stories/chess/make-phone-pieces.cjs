// node make-phone-pieces.cjs <sharp dir> <phone-new-game.png> <out dir>
// Chess.com's own pieces, for the strangers' games on the phone (Part II):
// cut from the start position in the author's first-game screenshot as
// rebuilt by make-phone.cjs (`new-game`, kept privately as
// chess-story/assets/phone-new-game.png in the data-stories repository; the
// board holds no names). Each piece is taken from one square, its square's own
// flat colour keyed out, everything inside its outline kept whole; the
// corners where the board writes coordinates (a1's "1", rank 1's letters) are cleared. Writes cc-wk.webp …
// cc-bp.webp, 120 px square, with alpha.
const sharp = require(process.argv[2])
const [input, out] = process.argv.slice(3)

// The board in phone-new-game.png (1400 x 2800): its top left corner and a square's side.
const LEFT = 235
const TOP = 984.5
const SIDE = 115.5
// Where each piece is taken from: a dark square wherever the piece has one
// (white pieces stand out from it most), clear of corner letters where it can be.
const FROM = {
  wr: "a1", wn: "g1", wb: "c1", wq: "d1", wk: "e1", wp: "b2",
  br: "h8", bn: "b8", bb: "c8", bq: "d8", bk: "e8", bp: "c7",
}
const SIZE = 120

;(async () => {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const at = (x, y) => {
    const i = (Math.round(y) * info.width + Math.round(x)) * 3
    return [data[i], data[i + 1], data[i + 2]]
  }
  const box = name => {
    const f = "abcdefgh".indexOf(name[0])
    const r = 8 - Number(name[1])
    return { x: LEFT + f * SIDE, y: TOP + r * SIDE }
  }
  // the two square colours, from empty squares of ranks 3 to 6
  const centre = name => {
    const b = box(name)
    return at(b.x + SIDE / 2, b.y + SIDE / 2)
  }
  const DARK = centre("a3")
  const LIGHT = centre("b3")
  console.log("dark", DARK, "light", LIGHT)
  const far = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])

  for (const [kind, square] of Object.entries(FROM)) {
    const b = box(square)
    const f = "abcdefgh".indexOf(square[0])
    const r = Number(square[1])
    const own = (f + 1 + r) % 2 === 0 ? DARK : LIGHT
    const w = Math.floor(SIDE)
    const alpha = new Float32Array(w * w)
    const raw = []
    for (let y = 0; y < w; y++)
      for (let x = 0; x < w; x++) {
        const p = at(b.x + x + 0.5, b.y + y + 0.5)
        raw.push(p)
        let a = Math.max(0, Math.min(1, (far(p, own) - 14) / 22))
        // the corners where the board writes its coordinates (no piece reaches them)
        if ((x < w * 0.16 && y < w * 0.22) || (x > w * 0.86 && y > w * 0.74)) a = 0
        alpha[y * w + x] = a
      }
    // Whatever the outline encloses is piece: anything not reached from the
    // square's edges through background is made whole (a white piece's light
    // shading is close to a light square's colour).
    const outside = new Uint8Array(w * w)
    const queue = []
    for (let i = 0; i < w; i++) for (const k of [i, (w - 1) * w + i, i * w, i * w + w - 1]) if (alpha[k] < 0.6 && !outside[k]) { outside[k] = 1; queue.push(k) }
    while (queue.length) {
      const k = queue.pop()
      const x = k % w, y = (k / w) | 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= w) continue
        const n = ny * w + nx
        if (!outside[n] && alpha[n] < 0.6) { outside[n] = 1; queue.push(n) }
      }
    }
    const rgba = Buffer.alloc(w * w * 4)
    for (let k = 0; k < w * w; k++) {
      const p = raw[k]
      const whole = !outside[k]
      const a = whole ? 1 : alpha[k]
      const keep = Math.max(a, 0.001)
      // where a pixel is part piece, part square, take the square's share out of its colour
      for (let c = 0; c < 3; c++) rgba[k * 4 + c] = whole ? p[c] : Math.max(0, Math.min(255, Math.round((p[c] - own[c] * (1 - a)) / keep)))
      rgba[k * 4 + 3] = Math.round(a * 255)
    }
    const file = `${out}/cc-${kind}.webp`
    await sharp(rgba, { raw: { width: w, height: w, channels: 4 } })
      .resize(SIZE, SIZE)
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(file)
    console.log(file.split("/").pop(), square)
  }
})()
