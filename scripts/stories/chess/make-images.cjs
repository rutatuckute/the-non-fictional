// node make-images.cjs <sharp dir> <out dir> "name|input.png|width[,width…][|quality]" …
// Trims the transparent edge, then writes one WebP with alpha per width:
// the first is <name>.webp, the others <name>-<width>.webp. Quality is 72
// unless given; a picture that is all grain gains little from more.
const sharp = require(process.argv[2])
const out = process.argv[3]
;(async () => {
  for (const spec of process.argv.slice(4)) {
    const [name, input, widths, quality = 72] = spec.split("|")
    const trimmed = await sharp(input).trim({ threshold: 1 }).toBuffer()
    for (const [index, width] of widths.split(",").map(Number).entries()) {
      const file = `${out}/${name}${index ? `-${width}` : ""}.webp`
      await sharp(trimmed).resize({ width }).webp({ quality: Number(quality), alphaQuality: 90 }).toFile(file)
      const meta = await sharp(file).metadata()
      console.log(file.split("/").pop(), meta.width, meta.height, `${Math.round(require("fs").statSync(file).size / 1024)} KB`)
    }
  }
})()
