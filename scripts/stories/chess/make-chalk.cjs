// node make-chalk.cjs <sharp dir> <out dir> "name|input.png|width[,width…]" …
// A drawing in dark ink and grain on light paper, made into the same drawing
// in the site's ivory on nothing, for the dark page: how much ink a pixel
// holds (from the paper's lightness to the ink's darkness) becomes how opaque
// it is, and every pixel takes the ivory. The paper's own tone is measured
// from the image's edges, so a cream or grey paper vanishes as cleanly as a
// white one. Then trimmed, and written as WebP.
const sharp = require(process.argv[2])
const out = process.argv[3]
const IVORY = [238, 232, 223]
;(async () => {
  for (const spec of process.argv.slice(4)) {
    const [name, input, widths] = spec.split("|")
    const { data, info } = await sharp(input).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true })
    const W = info.width
    const H = info.height
    // the paper: the median lightness along the edges
    const edge = []
    for (let x = 0; x < W; x++) edge.push(data[x], data[(H - 1) * W + x])
    for (let y = 0; y < H; y++) edge.push(data[y * W], data[y * W + W - 1])
    edge.sort((a, b) => a - b)
    const paper = edge[Math.floor(edge.length / 2)]
    // the ink: the darkest one percent
    const sorted = Uint8Array.from(data).sort()
    const ink = sorted[Math.floor(sorted.length * 0.01)]
    const rgba = Buffer.alloc(W * H * 4)
    for (let k = 0; k < W * H; k++) {
      const amount = Math.max(0, Math.min(1, (paper - 6 - data[k]) / (paper - 6 - ink)))
      rgba[k * 4] = IVORY[0]
      rgba[k * 4 + 1] = IVORY[1]
      rgba[k * 4 + 2] = IVORY[2]
      rgba[k * 4 + 3] = Math.round(255 * Math.pow(amount, 0.85))
    }
    const chalk = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer()
    const trimmed = await sharp(chalk).trim({ threshold: 1 }).png().toBuffer()
    for (const [index, width] of widths.split(",").map(Number).entries()) {
      const file = `${out}/${name}${index ? `-${width}` : ""}.webp`
      await sharp(trimmed).resize({ width }).webp({ quality: 82, alphaQuality: 92 }).toFile(file)
      const m = await sharp(file).metadata()
      console.log(file.split("/").pop(), m.width, m.height, `${Math.round(require("fs").statSync(file).size / 1024)} KB`, `(paper ${paper}, ink ${ink})`)
    }
  }
})()
