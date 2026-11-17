// node make-set-pair.cjs <sharp dir> <out dir> <inside.png> <outside.png>
// The two sides of the wooden set, made to turn as one object: the outside is
// scaled to the inside's height (a turn about the upright axis hides a change
// of width, never one of height), both are centred on one canvas, cut to the
// same box and written as WebP at 1000 and 600 px wide. Half-transparent
// pixels left at the cut-out's edge by the generator are dropped.
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
  for (const [name, image, width] of [["wooden-set", inner, a.width], ["wooden-board", outer, outerWidth]]) {
    const placed = await clean(await sharp(canvas).composite([{ input: image, left: Math.round((W - width) / 2), top: 20 }]).png().toBuffer())
    for (const [suffix, size] of [["", 1000], ["-600", 600]]) {
      const file = `${out}/${name}${suffix}.webp`
      await sharp(placed).resize({ width: size }).webp({ quality: 64, alphaQuality: 90 }).toFile(file)
      const m = await sharp(file).metadata()
      console.log(file.split("/").pop(), m.width, m.height, `${Math.round(require("fs").statSync(file).size / 1024)} KB`)
    }
  }
  console.log(`inside ${a.width}x${a.height}, outside ${b.width}x${b.height} scaled by ${scale.toFixed(3)} to ${outerWidth}x${a.height}; canvas ${W}x${H}`)
})()
