import * as React from "react"
import { c } from "./parts"

// The choice screen and reading header share names and visual identities.
export const INVESTIGATIONS = [
  { id: "what-we-say", label: "What we say about ourselves" },
  { id: "when-things-go-wrong", label: "When things go wrong" },
  { id: "what-we-choose", label: "What our choices reveal" },
]

export const InvestigationBoard = ({ id, compact = false }) => (
  <svg viewBox="0 0 80 84" aria-hidden="true" data-board={id} className={c("ch-investigationBoard")}>
    {Array.from({ length: 64 }, (_, i) => <rect key={i} x={(i % 8) * 10} y={Math.floor(i / 8) * 10} width={10} height={10} fill={(i % 8 + Math.floor(i / 8)) % 2 ? "#1c1b19" : "#2c2a27"} />)}
    {id === "what-we-say" ? <g>
      <rect x={9} y={22} width={62} height={26} rx={9} className={c("ch-diveClay")} />
      <path d="M58 47 l6 9 l-14 -9 z" className={c("ch-diveClay")} />
      {!compact && <text x={40} y={39} textAnchor="middle">soooo bad</text>}
    </g> : id === "when-things-go-wrong" ? <g>
      <image href="/images/stories/chess/cc-wq.webp" x={compact ? 18 : 27} y={compact ? 18 : 27} width={compact ? 44 : 26} height={compact ? 44 : 26} opacity={compact ? 0.65 : 0.35} />
      <path d="M27 27 L53 53 M53 27 L27 53" className={c("ch-diveLine")} />
    </g> : <g>
      <path d={compact ? "M27 60 V25 M21 32 L27 23 L33 32" : "M30 66 V44 M26 48 L30 42 L34 48"} className={c("ch-diveGrey")} />
      <path d={compact ? "M53 60 V25 M47 32 L53 23 L59 32" : "M50 66 V44 M46 48 L50 42 L54 48"} className={c("ch-diveLine")} />
      {!compact && <><text x={30} y={77} textAnchor="middle" className={c("ch-diveSmall")}>d4</text><text x={50} y={77} textAnchor="middle" className={c("ch-diveSmall")}>e4</text></>}
    </g>}
  </svg>
)
