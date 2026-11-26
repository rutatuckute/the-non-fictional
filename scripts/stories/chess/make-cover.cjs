// node make-cover.cjs <sharp dir> <original png> <public/images dir>
// The cover from the author's original: the dark grid of tiny boards behind the hands
// had her pieces in green; here they are the site's clay (the author's colour), and the
// green cast of the ground is taken back to the page's warm neutral. Writes the story's
// two WebP sizes and the article's cover JPEG (the share image).
const sharp = require(process.argv[2])
const [src, root] = process.argv.slice(3)
const CLAY = [201, 106, 75]

const recolour = async width => {
  const { data, info } = await sharp(src).removeAlpha().resize({ width }).raw().toBuffer({ resolveWithObject: true })
  for (let k = 0; k < data.length; k += 3) {
    const r = data[k], g = data[k + 1], b = data[k + 2]
    if (g > r + 12 && g > b + 8) {
      // a green dot: the same brightness, in clay; faint olive tints blend in smoothly
      const t = Math.min(1, g / 203)
      const a = Math.min(1, (g - Math.max(r, b)) / 40)
      data[k] = r + (CLAY[0] * t - r) * a
      data[k + 1] = g + (CLAY[1] * t - g) * a
      data[k + 2] = b + (CLAY[2] * t - b) * a
    } else if (g > r + 2 && g >= b && Math.max(r, g, b) < 130) {
      // the dark green cast of the ground
      const l = 0.3 * r + 0.59 * g + 0.11 * b
      const a = Math.min(1, (g - r) / 8) * 0.9
      data[k] = r + (l * 1.04 - r) * a
      data[k + 1] = g + (l - g) * a
      data[k + 2] = b + (l * 0.96 - b) * a
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
}

;(async () => {
  for (const [out, width, jpeg] of [["stories/chess/cover.webp", 1600], ["stories/chess/cover-800.webp", 800], ["uploads/chess-again-cover.jpg", 1600, true]]) {
    const img = await recolour(width)
    await (jpeg ? img.jpeg({ quality: 84, mozjpeg: true }) : img.webp({ quality: 80 })).toFile(`${root}/${out}`)
    console.log(out)
  }
})()
