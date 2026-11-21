// node make-phone.cjs <sharp dir> <phone.png> <screenshot.jpg> <out.png> [new-game]
// The phone of the story with the author's first Chess.com game on its screen:
// a render of the phone seen from the front, its screen switched off, and a
// real screenshot of the game laid on that screen. Made for these two pictures;
// the numbers below are theirs.
//
// Both players' profile pictures and usernames are kept in their places but
// blurred past reading. A picture is blurred within its own square (sigma 12
// on a square about 72 px wide). A name is blurred on a ground of the bar's
// flat colour (sigma 10 on letters about 17 px apart, which leaves less of a
// letter's shape than one step of the 256 a pixel can take); the blur is let
// spread above and below as it will, and is faded out towards the two ends of
// the name, where a rating or a badge stands close by. Every pixel that held a
// picture or a name, and every pixel near a name, is made from the blurred
// values alone; none is mixed with the original. The screenshot as supplied
// is kept out of the repository.
//
// The phone's own status bar (the time, the notifications, the battery) is
// taken out: its rows are filled with their flat colour.
//
// With `new-game` the same screen is made ready for any game about to begin
// (Part II, where the opponent keeps changing): the board is put back to the
// starting position, square by square from the screenshot's own squares (the
// result's flag and crown go with it); the move list, the opponent's bar and
// the digits of both clocks are emptied, for the page to write in.
//
// The phone's screen is a little taller than the screenshot (0.42 against
// 0.45 wide to high), so the app's own empty background is given a few more
// rows in two places where it is one flat colour: under the move list and
// above the toolbar, as the app would lay itself out on a taller screen.
const sharp = require(process.argv[2])
const [phone, shot, out, mode] = process.argv.slice(3)
const NEW = mode === "new-game"

// The screenshot, 921 x 2048. Boxes are [left, top, right, bottom], inclusive.
const BAR = [49, 45, 42]
const PICTURES = [[35, 422, 107, 491], [35, 1668, 107, 1740]]
const NAMES = [[130, 420, 377, 447], [174, 1669, 404, 1695]]
const STATUS = [24, 80]
// Rows of flat colour to repeat: [row, times].
const MORE = [[350, 77], [1810, 77]]
// The phone, 1400 x 2800: its black screen, the border left dark around the picture, the corners, the camera.
const SCREEN = { left: 223, top: 272, width: 947, height: 2231, border: 12, radius: 80 }
const CAMERA = { x: 696.5, y: 349, r: 27 }

// The screen before a game: see the header.
const newGame = (data, W, H, at) => {
  const get = (x, y) => [data[at(x, y)], data[at(x, y) + 1], data[at(x, y) + 2]]
  const fill = ([l, t, r, b], colour) => {
    for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) data.set(colour, at(x, y))
  }
  // the opponent's bar, whole; the move list; the digits in the two clocks
  fill([24, 400, 640, 510], BAR)
  for (let y = 222; y <= 296; y++) fill([30, y, 330, y], get(600, y))
  fill([662, 430, 874, 484], get(656, 456))
  fill([662, 1678, 874, 1732], get(656, 1705))
  // the board: the rows whose left edge is not the bar's colour
  const board = y => Math.abs(get(3, y)[0] - BAR[0]) + Math.abs(get(3, y)[1] - BAR[1]) > 60
  let top = 500
  while (!board(top)) top++
  let bottom = top
  while (board(bottom + 1)) bottom++
  const side = (bottom - top + 1) / 8
  const xs = i => Math.round((i * W) / 8)
  const ys = i => top + Math.round(i * side)
  const cell = name => {
    const f = "abcdefgh".indexOf(name[0])
    const r = 8 - Number(name[1])
    return [xs(f), ys(r), xs(f + 1) - 1, ys(r + 1) - 1]
  }
  const middle = name => {
    const [l, t, r, b] = cell(name)
    // an empty square's own colour, from a patch clear of any label
    let sum = [0, 0, 0]
    let n = 0
    for (let y = Math.round((t + b) / 2) - 8; y <= Math.round((t + b) / 2) + 8; y++)
      for (let x = Math.round((l + r) / 2) - 8; x <= Math.round((l + r) / 2) + 8; x++) {
        const p = get(x, y)
        sum = sum.map((v, i) => v + p[i])
        n++
      }
    return sum.map(v => Math.round(v / n))
  }
  const LIGHT = middle("c4")
  const DARK = middle("d6")
  const greenness = p => p[1] - (p[0] + p[2]) / 2
  // a square, taken from another; `turn` gives each pixel its new colour
  const put = (to, from, turn = p => p) => {
    const [l, t, r, b] = cell(to)
    const [fl, ft, fr, fb] = cell(from)
    const copy = []
    for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) copy.push(turn(get(Math.min(fr, fl + x - l), Math.min(fb, ft + y - t))))
    let i = 0
    for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) data.set(copy[i++].map(v => Math.max(0, Math.min(255, Math.round(v)))), at(x, y))
  }
  put("e2", "g2") // the pawn back home
  put("e4", "c4")
  put("f6", "d6") // the knight's square, empty and unmarked
  put("f2", "h2") // (the crown reached into this square)
  // The knight back on g8, a light square: the one from b8, which stands on a
  // dark one. Its square is taken out by how green each pixel is (the piece
  // itself is grey) and the light square put in for as much.
  const span = greenness(DARK) - 0
  put("g8", "b8", p => {
    const ground = Math.max(0, Math.min(1, greenness(p) / span))
    return p.map((v, i) => v + ground * (LIGHT[i] - DARK[i]))
  })
  // (a square's outermost pixels are mixed with its neighbours': those are simply the light square's)
  const [gl, gt, gr, gb] = cell("g8")
  for (let y = gt; y <= gb; y++) for (let x = gl; x <= gr; x++) if (x - gl < 4 || gr - x < 4 || y - gt < 4 || gb - y < 4) data.set(LIGHT, at(x, y))
  // the flag over e8 and f8: a king is the same left and right, so its left half is mirrored
  const mirror = (name, rows) => {
    const [l, t, r, b] = cell(name)
    for (let y = t; y <= t + Math.round((b - t) * rows); y++) for (let x = Math.ceil((l + r) / 2); x <= r; x++) data.set(get(l + r - x, y), at(x, y))
  }
  mirror("e8", 1)
  mirror("e1", 0.55) // above the letter in its corner
  // … and the corners of the bishops' squares that the flag and the crown reached into
  const corner = (name, colour) => {
    const [l, t, r, b] = cell(name)
    fill([l, t, l + Math.round((r - l) * 0.24), t + Math.round((b - t) * 0.42)], colour)
  }
  corner("f8", DARK)
  corner("f1", LIGHT)
  // (and a sliver of each further down the squares' shared edge)
  for (const [name, colour] of [["f8", DARK], ["f1", LIGHT]]) {
    const [l, t, , b] = cell(name)
    fill([l, t, l + 7, t + Math.round((b - t) * 0.7)], colour)
  }
  // whatever red of the flag is left in the two squares
  for (const [name, colour] of [["e8", LIGHT], ["f8", DARK]]) {
    const [l, t, r, b] = cell(name)
    for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) if (get(x, y)[0] - get(x, y)[1] > 50) data.set(colour, at(x, y))
  }
  // what of the flag stood above the board's edge
  fill([xs(4), top - 6, xs(6), top - 1], BAR)
  console.log(`board rows ${top} to ${bottom}; light ${LIGHT}, dark ${DARK}`)
}

;(async () => {
  const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const at = (x, y) => (y * W + x) * 3
  const cut = ([l, t, r, b]) => {
    const w = r - l + 1
    const h = b - t + 1
    const pixels = Buffer.alloc(w * h * 3)
    for (let y = 0; y < h; y++) data.copy(pixels, y * w * 3, at(l, t + y), at(l, t + y) + w * 3)
    return { pixels, w, h }
  }

  // a profile picture: blurred within its own square, its edge kept
  for (const box of NEW ? PICTURES.slice(1) : PICTURES) {
    const { pixels, w, h } = cut(box)
    const blurred = await sharp(pixels, { raw: { width: w, height: h, channels: 3 } }).blur(12).raw().toBuffer({ resolveWithObject: true })
    if (blurred.info.channels !== 3 || blurred.info.width !== w) throw new Error("the blurred picture is not the picture that was expected")
    const soft = blurred.data
    for (let y = 0; y < h; y++) soft.copy(data, at(box[0], box[1] + y), y * w * 3, (y + 1) * w * 3)
  }
  // a name: blurred on the bar's colour. Above and below, the blur spreads as
  // far as it goes (UP); along the name it is faded to nothing a little past
  // each end (OUT), from well inside the name (IN), so no edge shows.
  const PAD = 40
  const UP = 30
  const OUT = 8
  const IN = 26
  const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))
  for (const box of NEW ? NAMES.slice(1) : NAMES) {
    const { pixels, w, h } = cut(box)
    // the name alone on the bar's colour, with room around it for the blur
    const wide = w + 2 * PAD
    const high = h + 2 * PAD
    const alone = Buffer.alloc(wide * high * 3)
    for (let k = 0; k < wide * high; k++) alone.set(BAR, k * 3)
    for (let y = 0; y < h; y++) pixels.copy(alone, ((y + PAD) * wide + PAD) * 3, y * w * 3, (y + 1) * w * 3)
    const blurred = await sharp(alone, { raw: { width: wide, height: high, channels: 3 } }).blur(10).raw().toBuffer({ resolveWithObject: true })
    if (blurred.info.channels !== 3 || blurred.info.width !== wide) throw new Error("the blurred name is not the picture that was expected")
    const soft = blurred.data
    for (let y = box[1] - UP; y <= box[3] + UP; y++)
      for (let x = box[0] - OUT; x <= box[2] + OUT; x++) {
        const along = ease(Math.min(x - (box[0] - OUT), box[2] + OUT - x) / (OUT + IN))
        const across = ease(1 - Math.max(box[1] - y, 0, y - box[3]) / UP)
        const from = ((y - box[1] + PAD) * wide + (x - box[0] + PAD)) * 3
        // the bar's colour and the blurred name, and nothing of what was there
        for (let i = 0; i < 3; i++) data[at(x, y) + i] = Math.round(BAR[i] + (soft[from + i] - BAR[i]) * along * across)
      }
  }
  if (NEW) newGame(data, W, info.height, at)
  // the status bar: its rows, in their own flat colour
  for (const y of [STATUS[0] - 2, STATUS[1] + 2])
    for (let x = 1; x < W; x++) if (data[at(x, y)] !== data[at(0, y)]) throw new Error(`row ${y}, beside the status bar, is not flat`)
  for (let y = STATUS[0]; y <= STATUS[1]; y++) for (let x = 1; x < W; x++) data.copy(data, at(x, y), at(0, STATUS[0] - 2), at(0, STATUS[0] - 2) + 3)

  const rows = []
  for (let y = 0; y < info.height; y++) {
    const row = data.subarray(y * W * 3, (y + 1) * W * 3)
    const more = MORE.find(([at]) => at === y)
    if (more) {
      // only a row of one colour may be repeated
      for (let x = 1; x < W; x++) if (row[x * 3] !== row[0] || row[x * 3 + 1] !== row[1] || row[x * 3 + 2] !== row[2]) throw new Error(`row ${y} is not flat`)
    }
    for (let n = 0; n <= (more ? more[1] : 0); n++) rows.push(row)
  }
  const tall = Buffer.concat(rows)
  const w = SCREEN.width - 2 * SCREEN.border
  const h = SCREEN.height - 2 * SCREEN.border
  const r = SCREEN.radius - SCREEN.border
  const corners = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`)
  const picture = await sharp(tall, { raw: { width: W, height: rows.length, channels: 3 } })
    .resize({ width: w, height: h, fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .composite([{ input: corners, blend: "dest-in" }])
    .png()
    .toBuffer()
  console.log(`screenshot ${W}x${info.height}, with rows ${W}x${rows.length} (${(W / rows.length).toFixed(4)}), on a screen of ${w}x${h} (${(w / h).toFixed(4)})`)
  // how sharp the blurred parts still are: the largest step between two neighbouring pixels, of 255
  for (const [what, boxes] of [["pictures", PICTURES], ["names", NAMES]]) {
    let step = 0
    for (const [l, t, r2, b] of boxes)
      for (let y = t; y <= b; y++) for (let x = l + 1; x <= r2; x++) for (let i = 0; i < 3; i++) step = Math.max(step, Math.abs(data[at(x, y) + i] - data[at(x - 1, y) + i]))
    console.log(`${what}: largest step between neighbouring pixels ${step} of 255`)
  }
  // the camera stays in front of the picture, as a hole in the screen does
  const meta = await sharp(phone).metadata()
  const hole = Buffer.from(`<svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg"><circle cx="${CAMERA.x}" cy="${CAMERA.y}" r="${CAMERA.r}"/></svg>`)
  const camera = await sharp(phone).ensureAlpha().composite([{ input: hole, blend: "dest-in" }]).png().toBuffer()
  await sharp(phone)
    .composite([{ input: picture, left: SCREEN.left + SCREEN.border, top: SCREEN.top + SCREEN.border }, { input: camera }])
    .png()
    .toFile(out)
})()
