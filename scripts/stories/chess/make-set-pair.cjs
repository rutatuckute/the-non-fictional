// node make-set-pair.cjs <sharp dir> <out dir> <inside.png> <outside.png>
// The two sides of the wooden set, made to turn as one object: the outside is
// scaled to the inside's height, both are centred on one canvas and cut to the
// same box. Half-transparent pixels left at the cut-out's edge by the
// generator are dropped.
//
// The originals show the set with its hinge upright, its halves left and
// right. On the page it lies as it does between two players, the hinge across
// and a half for each: so the inside is turned a quarter to the left (the
// light pieces come nearest), and the outside is turned and mirrored (its
// corners stay a chessboard's: a dark square at the near left). Written as
// WebP at 838 and 500 px wide.
const sharp = require(process.argv[2])
const [out, inside, outside] = process.argv.slice(3)
const box = async file => {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  let [l, t, r, b] = [info.width, info.height, 0, 0]
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 200) [l, t, r, b] = [Math.min(l, x), Math.min(t, y), Math.max(r, x), Math.max(b, y)]
  return { left: l, top: t, width: r - l + 1, height: b - t + 1 }
}
const clean = async buffer => {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  for (let i = 3; i < data.length; i += 4) if (data[i] < 24) data[i] = 0
  return sharp(data, { raw: info }).png().toBuffer()
}
;(async () => {
  const [a, b] = [await box(inside), await box(outside)]
  const scale = a.height / b.height
  const inner = await sharp(inside).extract(a).png().toBuffer()
  const outer = await sharp(outside).extract(b).resize({ height: a.height }).png().toBuffer()
  const outerWidth = Math.round(b.width * scale)
  const W = Math.max(a.width, outerWidth) + 40
  const H = a.height + 40
  const canvas = { create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }
  // (the mirror is a step of its own: in one chain sharp mirrors before it turns)
  const turns = {
    "wooden-set": image => sharp(image).rotate(270),
    "wooden-board": async image => sharp(await sharp(image).rotate(90).png().toBuffer()).flop(),
  }
  for (const [name, image, width] of [["wooden-set", inner, a.width], ["wooden-board", outer, outerWidth]]) {
    const upright = await clean(await sharp(canvas).composite([{ input: image, left: Math.round((W - width) / 2), top: 20 }]).png().toBuffer())
    const placed = await (await turns[name](upright)).png().toBuffer()
    for (const [suffix, size] of [["", 838], ["-500", 500]]) {
      const file = `${out}/${name}${suffix}.webp`
      await sharp(placed).resize({ width: size }).webp({ quality: 64, alphaQuality: 90 }).toFile(file)
      const m = await sharp(file).metadata()
      console.log(file.split("/").pop(), m.width, m.height, `${Math.round(require("fs").statSync(file).size / 1024)} KB`)
    }
  }
  console.log(`inside ${a.width}x${a.height}, outside ${b.width}x${b.height} scaled by ${scale.toFixed(3)} to ${outerWidth}x${a.height}; canvas ${W}x${H}`)
})()
