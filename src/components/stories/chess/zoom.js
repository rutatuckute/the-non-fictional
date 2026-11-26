// Being drawn into a question. Where one question's board stands among the three
// (the choice screen after Part II, and the recaps between the questions), the next
// one is zoomed into as the reader scrolls on, until it fills the screen and gives
// way to the question itself. `scope` is the element the CSS reads the values
// from (--zoom 0..1, --dx and --dy to the centre of the screen, --zmax how far
// it grows); `board` is the question's list item; `centre` is the box the board
// moves to the middle of.
export const zoomInto = (scope, board, centre, q, cap = 26) => {
  const svg = board?.querySelector("svg")
  if (!svg || !centre) return
  const at = board.getBoundingClientRect()
  const to = centre.getBoundingClientRect()
  const width = svg.clientWidth || at.width
  const height = svg.clientHeight || (width * 84) / 80
  scope.style.setProperty("--zoom", q.toFixed(4))
  scope.style.setProperty("--dx", `${(to.left + to.width / 2 - (at.left + at.width / 2)).toFixed(1)}px`)
  scope.style.setProperty("--dy", `${(to.top + to.height / 2 - (at.top + height / 2)).toFixed(1)}px`)
  scope.style.setProperty("--zmax", Math.max(2, Math.min(cap, (1.15 * Math.max(to.width, to.height)) / width)).toFixed(2))
}
