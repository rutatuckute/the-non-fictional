// node webp.cjs <sharp dir> <out dir> name:input:mode[:crop] …  — trims, resizes, writes WebP with alpha.
const sharp = require(process.argv[2])
const out = process.argv[3]
;(async () => {
  for (const spec of process.argv.slice(4)) {
    const [name, input, mode, crop] = spec.split("|")
    let img = sharp(await sharp(input).trim({ threshold: 1 }).toBuffer())
    const m = await img.metadata()
    if (crop === "head") img = sharp(await img.extract({ left: 250, top: 0, width: 500, height: 560 }).toBuffer())
    if (crop === "top78") img = sharp(await img.extract({ left: 0, top: 0, width: m.width, height: Math.round(m.height * 0.78) }).toBuffer())
    const sized = mode === "wide" ? img.resize({ width: 480 }) : img.resize({ height: 240 })
    await sized.webp({ quality: 82, alphaQuality: 90 }).toFile(`${out}/${name}.webp`)
    const meta = await sharp(`${out}/${name}.webp`).metadata()
    console.log(name, meta.width, meta.height)
  }
})()
