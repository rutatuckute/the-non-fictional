// node make-pieces.cjs <sharp dir> <out dir> <sizes.json> <prefix> "<sheet.png>|<row>|<colour>" …
// A set's pieces, cut out of sheets drawn on a grid of 500 x 600 px cells,
// each row king, queen, rook, bishop, knight, pawn. A row of a sheet is named
// by its number (0 is the top one) and the colour it holds ("w" or "b"), so a
// set can take its two colours from one sheet or from two:
//
//   the wooden set   piece  "sheet.png|0|w" "sheet.png|1|b"
//   the club's set   club   "white.png|0|w" "first-sheet.png|1|b"
//
// Each piece is cut to the box around its solid part (alpha over 120; a plain
// trim is thrown by faint stray pixels), with a few pixels for its soft edge,
// and saved as <prefix>-<colour><piece>.webp with alpha at 40% of the sheet's
// size, all at one scale. Their sizes, in the sheet's pixels, are written to
// the json, from which the page sizes and places them.
const sharp = require(process.argv[2])
const [out, json, prefix, ...rows] = process.argv.slice(3)
const CELL = [500, 600]
const KINDS = "kqrbnp"
const SHRINK = 0.4
;(async () => {
  const sizes = {}
  for (const spec of rows) {
    const [sheet, rowText, colour] = spec.split("|")
    const row = Number(rowText)
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
        .toFile(`${out}/${prefix}-${name}.webp`)
      sizes[name] = { w, h }
      console.log(prefix, name, w, h)
    }
  }
  require("fs").writeFileSync(json, JSON.stringify(sizes) + "\n")
})()
