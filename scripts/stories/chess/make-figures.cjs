// node make-figures.cjs <sharp dir> <out dir> "name|input.png|width[,width…]" …
// An engraved figure, dark on white, made ready for the dark page: the white
// that surrounds it (everything white that touches the image's edge) becomes
// transparent, with a soft edge one pixel wide; the white inside it stays, as
// paper, and is warmed to the site's ivory so it is not a cold white. Nothing
// is inverted: shading stays shading. Then trimmed, and written as WebP.
const sharp = require(process.argv[2])
const out = process.argv[3]
const IVORY = [238, 232, 223]
;(async () => {
  for (const spec of process.argv.slice(4)) {
    const [name, input, widths] = spec.split("|")
    const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const W = info.width
    const H = info.height
    const light = k => Math.min(data[k * 4], data[k * 4 + 1], data[k * 4 + 2])
    // flood the surrounding white from the edges
    const outside = new Uint8Array(W * H)
    const stack = []
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x)
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1)
    while (stack.length) {
      const k = stack.pop()
      if (outside[k] || light(k) < 226) continue
      outside[k] = 1
      const x = k % W
      if (x > 0) stack.push(k - 1)
      if (x < W - 1) stack.push(k + 1)
      if (k >= W) stack.push(k - W)
      if (k < W * (H - 1)) stack.push(k + W)
    }
    for (let k = 0; k < W * H; k++) {
      const i = k * 4
      if (outside[k]) {
        data[i + 3] = 0
        continue
      }
      // a pixel on the border with the outside keeps the ink, not the paper
      const x = k % W
      const edge = (x > 0 && outside[k - 1]) || (x < W - 1 && outside[k + 1]) || (k >= W && outside[k - W]) || (k < W * (H - 1) && outside[k + W])
      const ink = 1 - light(k) / 255
      if (edge) data[i + 3] = Math.round(255 * Math.min(1, ink * 1.6))
      // paper to ivory, ink kept: each channel scaled from white towards ivory
      for (let c = 0; c < 3; c++) data[i + c] = Math.round((data[i + c] / 255) * IVORY[c])
    }
    const cut = await sharp(data, { raw: info }).png().toBuffer()
    const trimmed = await sharp(cut).trim({ threshold: 1 }).png().toBuffer()
    for (const [index, width] of widths.split(",").map(Number).entries()) {
      const file = `${out}/${name}${index ? `-${width}` : ""}.webp`
      await sharp(trimmed).resize({ width }).webp({ quality: 80, alphaQuality: 90 }).toFile(file)
      const m = await sharp(file).metadata()
      console.log(file.split("/").pop(), m.width, m.height, `${Math.round(require("fs").statSync(file).size / 1024)} KB`)
    }
  }
})()
