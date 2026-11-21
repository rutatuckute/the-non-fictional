// node make-boards.cjs <sharp dir> <out dir> <boards.json>
// "The board of a thousand games": how the author's games ended, each as a
// tiny board, laid out in a grid of 37 by 27. The middle place is left empty:
// on the page the club's board shrinks into it. A board's squares are two
// greys of the page; the pieces are dots of the site's green for data, the
// author's bright, her opponent's darker. The games come from the data-stories repository
// (chess-story/analysis/export_boards.py): final positions and the colour she
// played, nothing else. Written lossless, as it is all flat colour.
const sharp = require(process.argv[2])
const [out, file] = process.argv.slice(3)
const COLS = 37
const ROWS = 27
const CELL = 48
const SQUARE = 5
const EDGE = (CELL - 8 * SQUARE) / 2
const LIGHT = [44, 42, 39]
const DARK = [28, 27, 25]
// the site's green for data (--form-data), and the same at half strength on the page's dark
const MINE = [110, 203, 120]
const THEIRS = [66, 112, 72]
;(async () => {
  const { boards } = JSON.parse(require("fs").readFileSync(file, "utf8"))
  const places = COLS * ROWS - 1
  if (boards.length < places) throw new Error(`${boards.length} boards for ${places} places`)
  const W = COLS * CELL
  const H = ROWS * CELL
  const rgba = Buffer.alloc(W * H * 4)
  const dot = (x, y, w, colour) => {
    for (let j = 0; j < w; j++)
      for (let i = 0; i < w; i++) {
        const k = ((y + j) * W + x + i) * 4
        rgba[k] = colour[0]
        rgba[k + 1] = colour[1]
        rgba[k + 2] = colour[2]
        rgba[k + 3] = 255
      }
  }
  let next = 0
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      if (row === (ROWS - 1) / 2 && col === (COLS - 1) / 2) continue
      // the latest games nearest the middle would need a spiral; they are simply in order
      const [placement, mine] = boards[boards.length - places + next++]
      const left = col * CELL + EDGE
      const top = row * CELL + EDGE
      placement.split("/").forEach((rank, r) => {
        let f = 0
        for (const letter of rank) {
          if (/\d/.test(letter)) {
            f += Number(letter)
            continue
          }
          // (the squares are drawn below; here only where a piece stands)
          const white = letter === letter.toUpperCase()
          dot(left + f * SQUARE, top + r * SQUARE, SQUARE, (f + r) % 2 ? DARK : LIGHT)
          dot(left + f * SQUARE + 1, top + r * SQUARE + 1, SQUARE - 2, white === (mine === "w") ? MINE : THEIRS)
          f++
        }
      })
      for (let r = 0; r < 8; r++)
        for (let f = 0; f < 8; f++) {
          const k = ((top + r * SQUARE) * W + left + f * SQUARE) * 4
          if (!rgba[k + 3]) dot(left + f * SQUARE, top + r * SQUARE, SQUARE, (f + r) % 2 ? DARK : LIGHT)
        }
    }
  const name = `${out}/boards.webp`
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).webp({ lossless: true }).toFile(name)
  console.log(`boards.webp ${W}x${H}, ${places} boards, ${Math.round(require("fs").statSync(name).size / 1024)} KB`)
})()
