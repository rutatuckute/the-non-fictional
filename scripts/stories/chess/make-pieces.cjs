// node make-pieces.cjs <sharp dir> <out dir> <sheet.png> <pieces.json>
// The wooden set's pieces, cut out of one sheet: twelve pieces on a grid of 6
// columns by 2 rows of 500 x 600 px cells, light on top, dark below, each row
// king, queen, rook, bishop, knight, pawn. Each is cut to the box around its
// solid part (alpha over 120; a plain trim is thrown by faint stray pixels),
// with a few pixels for its soft edge, and saved as WebP with alpha at 40% of
// the sheet's size, all at one scale. Their sizes, in the sheet's pixels, are
// written to pieces.json, from which the page sizes and places them.
const sharp = require(process.argv[2])
const [out, sheet, json] = process.argv.slice(3)
const CELL = [500, 600]
const KINDS = "kqrbnp"
const SHRINK = 0.4
;(async () => {
  const sizes = {}
  for (const [row, colour] of [[0, "w"], [1, "b"]]) {
    for (let i = 0; i < KINDS.length; i++) {
      const cell = await sharp(sheet).extract({ left: i * CELL[0], top: row * CELL[1], width: CELL[0], height: CELL[1] }).ensureAlpha().raw().toBuffer()
      let x0 = CELL[0], x1 = 0, y0 = CELL[1], y1 = 0
      for (let y = 0; y < CELL[1]; y++)
        for (let x = 0; x < CELL[0]; x++)
          if (cell[(y * CELL[0] + x) * 4 + 3] > 120) {
            if (x < x0) x0 = x
            if (x > x1) x1 = x
            if (y < y0) y0 = y
            if (y > y1) y1 = y
          }
      const edge = 6
      x0 = Math.max(0, x0 - edge); y0 = Math.max(0, y0 - edge)
      x1 = Math.min(CELL[0] - 1, x1 + edge); y1 = Math.min(CELL[1] - 1, y1 + edge)
      const w = x1 - x0 + 1
      const h = y1 - y0 + 1
      const name = colour + KINDS[i]
      await sharp(cell, { raw: { width: CELL[0], height: CELL[1], channels: 4 } })
        .extract({ left: x0, top: y0, width: w, height: h })
        .resize({ width: Math.round(w * SHRINK) })
        .webp({ quality: 86, alphaQuality: 100 })
        .toFile(`${out}/piece-${name}.webp`)
      sizes[name] = { w, h }
      console.log(name, w, h)
    }
  }
  require("fs").writeFileSync(json, JSON.stringify(sizes) + "\n")
})()
