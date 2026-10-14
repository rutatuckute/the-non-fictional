// The minimum round-trip price, Paris–Vilnius–Paris for 20–27 December 2020,
// one quote a day from 1 to 18 December. Read off the piece's original chart:
// the scraped quotes themselves were not kept.
export const PRICES = [219, 229, 284, 285, 437, 535, 547, 495, 566, 578, 578, 594, 599, 607, 607, 607, 507, 505]
export const DAYS = PRICES.map((price, index) => ({ day: index + 1, price }))
export const DEPARTURE = 20
export const PEAK = Math.max(...PRICES)
export const euro = value => `€${value}`

// What the chart shows at each step of the story, in the order the body's
// steps come. The words are the body's; only the picture is set here.
export const STATES = [
  { upTo: 1, mark: [1] },
  { upTo: 7, mark: [7] },
  { upTo: 16, mark: [14], band: [14, 16] },
  { upTo: 18, mark: [17], note: true },
  { upTo: 18, mark: [], note: true, explore: true },
]
