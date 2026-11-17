// node make-print.cjs <sharp dir> <out dir> "name|input.png|width[,width…]" …
// An engraved figure, dark on white, printed for the dark page in two inks, as
// every.to prints its figures: the page itself and the site's ivory, nothing
// in between. The fine hatching is softened away first (blur 3 px at the
// source's size), so only the large shapes and the shadows survive, and the
// shadows become stipple: each pixel is dark when it is darker than a
// threshold that wavers from pixel to pixel. The white around the figure
// (white that touches the image's edge) and the dark ink inside it are
// transparent, so the page shows through both; only the ivory is drawn.
// The same settings for every figure, so they all match.
const sharp = require(process.argv[2])
const out = process.argv[3]
const IVORY = [238, 232, 223]
// CONTRAST stretches the softened tones away from the middle before the
// threshold: above 1, shadows print denser and lights cleaner. Settings can be
// overridden for a trial with PRINT=soften,cut,spread,contrast.
const [SOFTEN, CUT, SPREAD, CONTRAST] = (process.env.PRINT || "3,150,150,1").split(",").map(Number)
;(async () => {
  for (const spec of process.argv.slice(4)) {
    const [name, input, widths] = spec.split("|")
    const { data, info } = await sharp(input).greyscale().raw().toBuffer({ resolveWithObject: true })
    // no softening at all keeps every engraved line, crisp
    const soft = SOFTEN > 0 ? await sharp(input).greyscale().blur(SOFTEN).raw().toBuffer() : data
    const W = info.width
    const H = info.height
    const outside = new Uint8Array(W * H)
    const stack = []
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x)
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1)
    while (stack.length) {
      const k = stack.pop()
      if (outside[k] || data[k] < 226) continue
      outside[k] = 1
      const x = k % W
      if (x > 0) stack.push(k - 1)
      if (x < W - 1) stack.push(k + 1)
      if (k >= W) stack.push(k - W)
      if (k < W * (H - 1)) stack.push(k + W)
    }
    let seed = 11
    const wobble = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5
    const rgba = Buffer.alloc(W * H * 4)
    for (let k = 0; k < W * H; k++) {
      const tone = Math.max(0, Math.min(255, 128 + (soft[k] - 128) * CONTRAST))
      const dark = tone < CUT + wobble() * SPREAD
      if (outside[k] || dark) continue
      rgba[k * 4] = IVORY[0]
      rgba[k * 4 + 1] = IVORY[1]
      rgba[k * 4 + 2] = IVORY[2]
      rgba[k * 4 + 3] = 255
    }
    const printed = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer()
    for (const [index, width] of widths.split(",").map(Number).entries()) {
      const file = `${out}/${name}${index ? `-${width}` : ""}.webp`
      // quality 82 keeps the dots as crisp as lossless, at two thirds of the size
      await sharp(printed).resize({ width, kernel: "lanczos3" }).webp({ quality: 82, alphaQuality: 100 }).toFile(file)
      const m = await sharp(file).metadata()
      console.log(file.split("/").pop(), m.width, m.height, `${Math.round(require("fs").statSync(file).size / 1024)} KB`)
    }
  }
})()
