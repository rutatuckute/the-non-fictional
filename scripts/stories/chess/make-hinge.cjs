// node make-hinge.cjs <sharp dir> <phone-front.png> <chat screenshot.jpg> <out dir>
// Part IV's phone: the message that started it, and the author's answer, as
// they stood on the screen on Monday 18 May, 23:52. From the chat screenshot
// (kept privately in the data-stories repository, never in this one) only
// three things are lit: his question, its hour, and her answer. Everything
// else is drawn pure black, made of no pixel of the screenshot, so no name,
// photograph or profile picture can show. Writes hinge.webp (800 wide) and
// hinge-480.webp, cut like the story's other phones.
const sharp = require(process.argv[2])
const [phonePath, shotPath, out] = process.argv.slice(3)

const SECOND = [178, 171, 160] // the page's second ink, for the hour
// The phone, 1400 x 2800 (as in make-phone.cjs): its screen, and the cut the story's phones use.
const SCREEN = { left: 235, top: 284, width: 923, height: 2207 }
const CUT = { left: 120, top: 154, width: 1160, height: 2471 }

;(async () => {
  const { data, info } = await sharp(shotPath).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height
  const at = (x, y) => (y * W + x) * 3
  const get = (x, y) => [data[at(x, y)], data[at(x, y) + 1], data[at(x, y) + 2]]
  const far = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])

  // A bubble: every pixel joined to the seed and of its colour, then each row
  // filled from its first such pixel to its last (the words lie inside).
  const bubble = ([sx, sy], rows, within = 26) => {
    const colour = get(sx, sy)
    const seen = new Uint8Array(W * H)
    const stack = [[sx, sy]]
    seen[sy * W + sx] = 1
    while (stack.length) {
      const [x, y] = stack.pop()
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || nx >= W || ny < rows[0] || ny > rows[1] || seen[ny * W + nx]) continue
        if (far(get(nx, ny), colour) > within) continue
        seen[ny * W + nx] = 1
        stack.push([nx, ny])
      }
    }
    const mask = new Uint8Array(W * H)
    let box = [W, H, 0, 0]
    for (let y = rows[0]; y <= rows[1]; y++) {
      let l = -1, r = -1
      for (let x = 0; x < W; x++) if (seen[y * W + x]) { if (l < 0) l = x; r = x }
      if (l < 0) continue
      for (let x = l + 1; x < r; x++) mask[y * W + x] = 255
      box = [Math.min(box[0], l), Math.min(box[1], y), Math.max(box[2], r), Math.max(box[3], y)]
    }
    for (let x = 0; x < W; x++) { mask[box[1] * W + x] = 0; mask[box[3] * W + x] = 0 }
    return { mask, box }
  }
  // (sharp may hand a one-channel picture back with three: read by its own count)
  const soft = async mask => {
    const { data: d, info: i } = await sharp(Buffer.from(mask), { raw: { width: W, height: H, channels: 1 } }).blur(0.8).raw().toBuffer({ resolveWithObject: true })
    const a = new Uint8Array(W * H)
    for (let k = 0; k < W * H; k++) a[k] = d[k * i.channels]
    return a
  }

  const hers = bubble([500, 1620], [1570, 1808])
  const his = bubble([500, 1400], [1340, 1575])
  console.log("his", his.box.join(","), "hers", hers.box.join(","))

  // The hour above the question: grey words on white, turned to the page's second ink on black.
  const HOUR = [250, 1262, 680, 1346]
  const hour = new Uint8Array(W * H)
  for (let y = HOUR[1]; y <= HOUR[3]; y++) for (let x = HOUR[0]; x <= HOUR[2]; x++) {
    const v = Math.min(...get(x, y))
    hour[y * W + x] = Math.round(255 * Math.max(0, Math.min(1, (244 - v) / 130)))
  }

  const px = Buffer.alloc(W * H * 4) // all clear: the switched-off screen shows through
  for (let i = 0; i < W * H; i++) if (hour[i]) px.set([...SECOND, hour[i]], i * 4)
  for (const part of [his, hers]) {
    const a = await soft(part.mask)
    for (let i = 0; i < W * H; i++) if (a[i]) px.set([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], a[i]], i * 4)
  }
  const lit = await sharp(px, { raw: { width: W, height: H, channels: 4 } }).resize({ width: SCREEN.width }).png().toBuffer()
  const litH = (await sharp(lit).metadata()).height
  // as a chat sits: from the bottom of the screen up
  const phone = await sharp(phonePath)
    .composite([{ input: lit, left: SCREEN.left, top: SCREEN.top + SCREEN.height - litH }])
    .extract(CUT)
    .png()
    .toBuffer()
  for (const [name, width] of [["hinge", 800], ["hinge-480", 480]]) {
    const file = `${out}/${name}.webp`
    await sharp(phone).resize({ width }).webp({ quality: 84, alphaQuality: 90 }).toFile(file)
    const m = await sharp(file).metadata()
    console.log(file.split("/").pop(), m.width, m.height)
  }
})()
