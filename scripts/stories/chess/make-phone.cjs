// node make-phone.cjs <sharp dir> <phone.png> <screenshot.jpg> <out.png>
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
// The phone's screen is a little taller than the screenshot (0.42 against
// 0.45 wide to high), so the app's own empty background is given a few more
// rows in two places where it is one flat colour: under the move list and
// above the toolbar, as the app would lay itself out on a taller screen.
const sharp = require(process.argv[2])
const [phone, shot, out] = process.argv.slice(3)

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
  for (const box of PICTURES) {
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
  for (const box of NAMES) {
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
