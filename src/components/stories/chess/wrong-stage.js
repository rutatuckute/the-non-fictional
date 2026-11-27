"use client"

import * as React from "react"

import { c } from "./parts"

// "When things go wrong" on one stage, as in the Part III prototype
// (data-stories chess-story/analysis/out/part3-prototype.html): the same marks are
// opponents, games and her own games in turn, and each step moves them instead of
// drawing a new chart. A big board in the story's own ivory and grey shrinks into
// one of a hundred small boards; the hundred play out and fold into dots; the dots
// regroup into the price, the clock, the ratings, her own games.
//
// The stage is a 600 × 600 drawing. Each mark ("atom") is a group translated to its
// place, holding a small board (its opacity `b`, its size `bs`) and a dot (its size
// `s`, round `r`, its role's colour). CSS carries every change, with a delay per mark.

export const VIEW = 600
export const ATOMS = 200
const MINI = 52

// roles, as the words' highlights name them (highlights.js)
//   crowd  ivory: did not lose, resigned      faint  grey: the rest that counts
//   dim    dark: the rest                     me     clay: hers
//   meHollow  clay ring: hers, played on and lost     you  green: the reader's
export const placement = fen => String(fen || "8/8/8/8/8/8/8/8").split(" ")[0]
export const parse = fen => {
  const out = []
  placement(fen).split("/").forEach((row, r) => {
    let f = 0
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch)
      else out.push([r, f++, ch])
    }
  })
  return out
}

// A small board: a chequer, the pieces as dots (white ivory, black dark and ringed).
const Mini = React.memo(function Mini({ fen, flip, pattern }) {
  const q = MINI / 8
  return (
    <>
      <rect width={MINI} height={MINI} fill={`url(#${pattern})`} />
      {parse(fen).map(([r, f, ch]) => {
        const kind = ch.toLowerCase()
        return (
          <circle
            key={`${r}${f}`}
            cx={(flip ? 7 - f : f) * q + q / 2}
            cy={(flip ? 7 - r : r) * q + q / 2}
            r={q * (kind === "k" ? 0.42 : kind === "p" ? 0.26 : 0.34)}
            className={c(ch === ch.toUpperCase() ? "ch-miniWhite" : "ch-miniBlack")}
          />
        )
      })}
    </>
  )
})

const Atom = React.memo(function Atom({ x, y, s, r, role, o, b, bs, fen, flip, delay, dot, pattern, title }) {
  const wait = `${delay}ms`
  return (
    <g className={c("ch-atom")} style={{ transform: `translate(${x}px, ${y}px)`, opacity: o, transitionDelay: wait }}>
      {title ? <title>{title}</title> : null}
      {fen ? (
        <g className={c("ch-atomBoard")} style={{ opacity: b, transform: `scale(${bs / MINI}) translate(${-MINI / 2}px, ${-MINI / 2}px)`, transitionDelay: wait }}>
          <Mini fen={fen} flip={flip} pattern={pattern} />
        </g>
      ) : null}
      <g className={c("ch-atomDot")} style={{ transform: `scale(${s})`, transitionDelay: wait }}>
        <rect x={-0.5} y={-0.5} width={1} height={1} rx={r} data-role={role} vectorEffect="non-scaling-stroke" data-dot={dot} />
      </g>
    </g>
  )
})

const HIDDEN = { x: VIEW / 2, y: VIEW / 2, s: 0, r: 0.5, role: "dim", o: 0, b: 0, bs: 50, delay: 0 }

// The big board: the author's game, ivory and grey, Chess.com's pieces.
const PIECE = letter => `/images/stories/chess/cc-${letter === letter.toUpperCase() ? "w" : "b"}${letter.toLowerCase()}.webp`
export const BOARD = { x: 60, y: 0, size: 480 }
const BigBoard = ({ fen, flip, at, cell, caption }) => {
  const q = BOARD.size / 8
  const [cx, cy] = cell
  const transform =
    at === "full"
      ? `translate(${BOARD.x}px, ${BOARD.y}px)`
      : at === "cell"
        ? `translate(${cx - 25}px, ${cy - 25}px) scale(${50 / BOARD.size})`
        : `translate(${BOARD.x + BOARD.size / 2 - 10}px, ${BOARD.y + BOARD.size / 2 - 10}px) scale(${20 / BOARD.size})`
  return (
    <>
      <g className={c("ch-bigBoard")} style={{ transform, opacity: at === "full" ? 1 : 0 }} aria-hidden="true">
        {Array.from({ length: 64 }, (_, i) => {
          const r = Math.floor(i / 8)
          const f = i % 8
          return <rect key={i} x={f * q} y={r * q} width={q} height={q} className={c((r + f) % 2 ? "ch-bigDark" : "ch-bigLight")} />
        })}
        {parse(fen).map(([r, f, ch]) => (
          <image key={`${r}${f}${ch}`} href={PIECE(ch)} x={(flip ? 7 - f : f) * q} y={(flip ? 7 - r : r) * q} width={q} height={q} />
        ))}
      </g>
      <text x={BOARD.x} y={BOARD.y + BOARD.size + 30} className={c("ch-stageCaption")} data-on={at === "full" && caption ? "true" : "false"}>
        {caption}
      </text>
    </>
  )
}

// The stage's own words above the drawing: a title, its colours as chips, a big number.
const Head = ({ head, num }) => (
  <div className={c("ch-stageHead")}>
    <p className={c("ch-ratingTitle", "ch-stageTitle")}>
      {/* (a mark for the travelling dot, travellers.js, beside the title of her own games) */}
      {head?.dot ? <b className={c("ch-dotMark", "ch-dotInline")} data-dot={head.dot} /> : null}
      {head?.title}
    </p>
    <div className={c("ch-ratingChips")} aria-hidden="true">
      {(head?.chips || []).map(([tone, text]) => (
        <span key={tone + text} className={c("ch-ratingChip")} data-tone={tone}>
          {text}
        </span>
      ))}
    </div>
    <p className={c("ch-stageNum")} data-tone={num?.tone} data-on={num ? "true" : "false"} aria-live="polite">
      {num ? (
        <>
          {num.n}
          <small>{num.unit}</small>
        </>
      ) : (
        " "
      )}
    </p>
  </div>
)

// The camera: each scene says which part of the drawing it uses (`box`, in the
// drawing's 600 units), and the stage fits that part to the room it has, centred
// under the title, as Q1's charts are. It never draws larger than MOST times the
// drawing, so the marks keep about the size of Q1's (the board about 320 px, a
// hundred dots about 400 px) from one scene to the next. The camera moves with the
// marks, so one chart still turns into the next. Labels keep their size on screen (--u).
const FULL = [0, 0, VIEW, VIEW]
const MOST = 0.66
const useRoom = () => {
  const ref = React.useRef(null)
  const [room, setRoom] = React.useState({ w: VIEW, h: VIEW })
  React.useLayoutEffect(() => {
    const svg = ref.current
    if (!svg) return
    const set = (w, h) => w > 0 && h > 0 && setRoom(r => (Math.abs(r.w - w) < 1 && Math.abs(r.h - h) < 1 ? r : { w, h }))
    const observer = new ResizeObserver(([entry]) => set(entry.contentRect.width, entry.contentRect.height))
    observer.observe(svg)
    set(svg.clientWidth, svg.clientHeight)
    return () => observer.disconnect()
  }, [])
  return [ref, room]
}

// One scene: { head, num, board: { fen, flip, at, caption }, atoms: i => spec | null, labels, label, most }
export const Stage = ({ scene, cell, label }) => {
  const [room, { w, h }] = useRoom()
  const [x0, y0, x1, y1] = scene.box || FULL
  // (on a wide screen a little air before the words' column)
  const room_ = w - (w > 500 ? 28 : 0)
  // (the charts with axes and words, the price and the ratings, may take more: scene.most)
  const k = Math.min(room_ / (x1 - x0), h / (y1 - y0), scene.most ?? MOST)
  const dx = Math.max(0, (room_ - (x1 - x0) * k) / 2)
  const camera = { transform: `translate(${(dx - x0 * k).toFixed(1)}px, ${(-y0 * k).toFixed(1)}px) scale(${k.toFixed(4)})`, "--u": (1 / k).toFixed(4) }
  const pattern = `ch-stage-check-${React.useId().replace(/:/g, "")}`
  const specs = React.useMemo(() => Array.from({ length: ATOMS }, (_, i) => scene.atoms?.(i) || null), [scene])
  // a mark that is not in the scene fades where it is (it keeps its last place)
  const last = React.useRef([])
  const atoms = specs.map((spec, i) => {
    const was = last.current[i] || HIDDEN
    const now = spec ? { ...HIDDEN, o: 1, ...spec } : { ...was, o: 0, delay: 0, dot: undefined, title: undefined }
    last.current[i] = now
    return now
  })
  const board = scene.board || { at: "off" }
  return (
    <figure className={c("ch-stage2")}>
      <Head head={scene.head} num={scene.num} />
      <svg ref={room} viewBox={`0 0 ${w.toFixed(0)} ${h.toFixed(0)}`} preserveAspectRatio="xMinYMin meet" role="img" aria-label={label || scene.label || scene.head?.title}>
        <defs>
          <pattern id={pattern} width={MINI / 4} height={MINI / 4} patternUnits="userSpaceOnUse">
            <rect width={MINI / 4} height={MINI / 4} fill="#2b2927" />
            <rect width={MINI / 8} height={MINI / 8} fill="#3a3734" />
            <rect x={MINI / 8} y={MINI / 8} width={MINI / 8} height={MINI / 8} fill="#3a3734" />
          </pattern>
        </defs>
        <g className={c("ch-stageCamera")} style={camera}>
          {scene.labels}
          <BigBoard fen={board.fen} flip={board.flip} at={board.at} cell={cell} caption={board.caption} />
          <g>
            {atoms.map((a, i) => (
              <Atom key={i} {...a} pattern={pattern} />
            ))}
          </g>
        </g>
      </svg>
    </figure>
  )
}

// A group of labels shown only in some scenes: it fades in after the marks have moved.
export const Labels = ({ on, children }) => (
  <g className={c("ch-stageLabels")} data-on={on ? "true" : "false"} aria-hidden="true">
    {children}
  </g>
)
