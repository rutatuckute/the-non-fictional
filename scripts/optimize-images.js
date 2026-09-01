#!/usr/bin/env node
//
// Normalises everything in static/images/uploads/ to a web master: longest edge
// 2560px, sensibly compressed, EXIF rotation applied and metadata stripped.
// Netlify's Image CDN generates every size the site actually serves from these,
// so 2560px is a ceiling rather than a target — anything larger is weight that
// stays in git history forever.
//
//   npm run images:optimize   rewrite anything oversized, in place
//   npm run images:check      report only, non-zero exit if work is pending
//
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const DIR = path.join(__dirname, "..", "static", "images", "uploads")
const MAX_EDGE = 2560
const JPEG_QUALITY = 82
const checkOnly = process.argv.includes("--check")

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`

const needsWork = (meta, size) =>
  Math.max(meta.width, meta.height) > MAX_EDGE ||
  // A correctly encoded master of this size lands well under a megabyte; past
  // that it is worth a re-encode even when the dimensions are already fine.
  size > 1_200_000

const run = async () => {
  if (!fs.existsSync(DIR)) {
    console.error(`No such directory: ${DIR}`)
    process.exit(1)
  }

  const files = fs
    .readdirSync(DIR)
    .filter((file) => !file.startsWith(".") && !file.endsWith(".svg"))

  let pending = 0
  let before = 0
  let after = 0

  for (const file of files) {
    const target = path.join(DIR, file)
    const size = fs.statSync(target).size

    let meta
    try {
      meta = await sharp(target).metadata()
    } catch (error) {
      console.warn(`  skipped (unreadable): ${file} — ${error.message}`)
      continue
    }

    if (!needsWork(meta, size)) continue

    pending += 1
    before += size

    if (checkOnly) {
      console.log(
        `  oversized: ${file} (${meta.width}x${meta.height}, ${kb(size)})`
      )
      after += size
      continue
    }

    // Transparency has to survive, so only genuinely non-opaque images stay PNG.
    const stats = await sharp(target).stats()
    const keepAlpha = meta.hasAlpha && !stats.isOpaque

    let pipeline = sharp(target)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })

    pipeline = keepAlpha
      ? pipeline.png({ compressionLevel: 9, palette: true })
      : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })

    // Write beside the original and swap, so a failure never truncates a photo.
    const temp = `${target}.tmp`
    await pipeline.toFile(temp)
    fs.renameSync(temp, target)

    const now = fs.statSync(target).size
    after += now
    console.log(`  ${file}: ${kb(size)} -> ${kb(now)}`)
  }

  if (pending === 0) {
    console.log(`All ${files.length} images are already web masters.`)
    return
  }

  if (checkOnly) {
    console.log(
      `\n${pending} image(s) need optimising. Run: npm run images:optimize`
    )
    process.exit(1)
  }

  console.log(
    `\nOptimised ${pending} image(s): ${kb(before)} -> ${kb(after)} ` +
      `(${Math.round(100 - (after / before) * 100)}% smaller)`
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
