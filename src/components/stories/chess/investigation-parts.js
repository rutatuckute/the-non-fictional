import * as React from "react"
import { c } from "./parts"

// The choice screen and reading header share names and visual identities.
export const INVESTIGATIONS = [
  { id: "what-we-say", label: "What we say about ourselves" },
  { id: "when-things-go-wrong", label: "When things go wrong" },
  { id: "what-we-choose", label: "What our choices reveal" },
]

// A question's name, as it is written everywhere: the third with "choices" in italics.
export const InvestigationName = ({ id }) =>
  id === "what-we-choose" ? <>What our <em>choices</em> reveal</> : INVESTIGATIONS.find(q => q.id === id)?.label

export const InvestigationBoard = ({ id, compact = false }) => (
  <svg viewBox="0 0 80 84" aria-hidden="true" data-board={id} className={c("ch-investigationBoard")}>
    {Array.from({ length: 64 }, (_, i) => <rect key={i} x={(i % 8) * 10} y={Math.floor(i / 8) * 10} width={10} height={10} fill={(i % 8 + Math.floor(i / 8)) % 2 ? "#1c1b19" : "#2c2a27"} />)}
    {/* each question has its object, as in the story: the phone with her message, the king laid down, the professor */}
    {id === "what-we-say" ? <g>
      <image href="/images/stories/chess/phone-480.webp" x={26} y={8} width={28} height={60} />
      <rect x={12} y={28} width={56} height={20} rx={8} className={c("ch-diveClay")} />
      <path d="M52 47 l6 9 l-14 -9 z" className={c("ch-diveClay")} />
      {!compact && <text x={40} y={42} textAnchor="middle">soooo bad</text>}
    </g> : id === "when-things-go-wrong" ? <g>
      <image href="/images/stories/chess/club-wk.webp" x={26} y={19} width={28} height={46} transform="rotate(48 40 42)" />
    </g> : <g>
      <image href="/images/stories/chess/professor-300.webp" x={18} y={14} width={44} height={66} />
    </g>}
  </svg>
)
