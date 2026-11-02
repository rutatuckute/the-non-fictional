import * as React from "react"

import TESTS from "./data/tests.json"
import THREADS from "./data/threads.json"
import { FINDINGS, TEST_PARTS, THREAD_EXTRAS, say } from "./story-copy"
import { shared, still } from "./story-motion"
import { Ext, Verdict, day } from "./story-parts"
import styles from "./narrative.module.css"

// What the data says. One claim is left at the centre. Its words become the
// analysis: each measurable phrase is underlined and answered with the
// definition we chose. The definitions then move into the headers of the chart
// that tests them. The finding comes first, the chart proves it, and everything
// else (price against policy, each country's measure, the method, what can't be
// settled) opens on demand.

export { TESTS }
const COUNTRY = {
  FR: ["France", "France"],
  BE: ["Belgique", "Belgium"],
  DE: ["Allemagne", "Germany"],
  ES: ["Espagne", "Spain"],
  IT: ["Italie", "Italy"],
  LU: ["Luxembourg", "Luxembourg"],
}
// in a sentence: "Spain and Italy", "l'Espagne et l'Italie"
const NAMED = {
  BE: ["la Belgique", "Belgium"],
  DE: ["l'Allemagne", "Germany"],
  ES: ["l'Espagne", "Spain"],
  IT: ["l'Italie", "Italy"],
  LU: ["le Luxembourg", "Luxembourg"],
}
// after "fell in", "a baissé en"
const IN = {
  BE: ["en Belgique", "Belgium"],
  DE: ["en Allemagne", "Germany"],
  ES: ["en Espagne", "Spain"],
  IT: ["en Italie", "Italy"],
  LU: ["au Luxembourg", "Luxembourg"],
}
const WORD = {
  en: ["zero", "one", "two", "three", "four", "five", "six"],
  fr: ["zéro", "un", "deux", "trois", "quatre", "cinq", "six"],
}
const eur = (f, v, d = 2) =>
  f.lang === "fr"
    ? `${f.num(v, { minimumFractionDigits: d, maximumFractionDigits: d })} €`
    : `€${f.num(v, { minimumFractionDigits: d, maximumFractionDigits: d })}`
const signed = (f, v) => {
  const r = Math.round(v * 100) / 100
  return `${r > 0 ? "+" : r < 0 ? "−" : "±"}${eur(f, Math.abs(r))}`
}
const list = (f, xs) =>
  xs.length > 1
    ? `${xs.slice(0, -1).join(", ")}${f.lang === "fr" ? " et " : " and "}${xs.at(-1)}`
    : xs[0] || ""
const names = (f, rows, table) =>
  list(
    f,
    rows.map(r => f.L(table[r.geo])),
  )

// The test's reading, computed from the figures: who cut (a rate change
// before the claim), who followed after it, who did not
export const readTest = topic => {
  const data = TESTS[topic]
  if (!data) return null
  const nb = data.rows.filter(r => r.geo !== "FR")
  const cut = nb.filter(r => r.rate < -0.01)
  const later = nb.filter(
    r => !cut.includes(r) && r.measure && r.measure.from > data.weeks.claim,
  )
  const fell = nb.filter(r => r.claim < r.before - 0.005)
  const rose = nb.filter(r => r.claim > r.before + 0.005)
  return { data, nb, cut, later, fell, rose }
}

// the claim, its words cut at its measurable phrases (a phrase can hold
// two parts)
const segments = (claim, parts) => {
  const out = []
  let rest = claim
  let k = 0
  const seen = new Set()
  for (const [i, p] of parts.entries()) {
    if (seen.has(p.text)) {
      out.find(s => s.text === p.text)?.parts.push(i)
      continue
    }
    const at = rest.indexOf(p.text)
    if (at < 0) continue
    if (at) out.push({ text: rest.slice(0, at), parts: [], k: k++ })
    out.push({ text: p.text, parts: [i], k: k++ })
    seen.add(p.text)
    rest = rest.slice(at + p.text.length)
  }
  if (rest) out.push({ text: rest, parts: [], k: k++ })
  return out
}

// mode 0 the claim, 1 its parts, 2 the evidence
export const ClaimTest = ({ topic, mode, f, onMore }) => {
  const th = THREADS[topic]
  const parts = TEST_PARTS[topic]
  const read = readTest(topic)
  const x = THREAD_EXTRAS[topic] || {}
  const ref = React.useRef(null)
  const [english, setEnglish] = React.useState(false)
  const [lines, setLines] = React.useState([])
  // the thin connectors from each phrase to its question
  React.useLayoutEffect(() => {
    setLines([])
    if (mode !== 1) return undefined
    const measure = () => {
      const box = ref.current?.getBoundingClientRect()
      if (!box) return
      const out = []
      ref.current.querySelectorAll("[data-part]").forEach(note => {
        const i = +note.dataset.part
        const word = ref.current.querySelector(`[data-parts~="${i}"]`)
        if (!word) return
        const a = word.getBoundingClientRect()
        const b = note.getBoundingClientRect()
        out.push({
          i,
          x1: a.left - box.left + a.width / 2,
          y1: a.bottom - box.top + 4,
          x2: b.left - box.left + 6,
          y2: b.top - box.top - 4,
        })
      })
      setLines(out)
    }
    const t = setTimeout(measure, still() ? 0 : 80)
    window.addEventListener("resize", measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", measure)
    }
  }, [mode, f.lang])
  if (!th?.test || !parts || !read) return null
  const fc = th.factcheck
  const segs = segments(th.test.claim, parts)
  if (mode === 2)
    return (
      <div className={styles.test} data-mode={mode} ref={ref}>
        <Evidence
          topic={topic}
          parts={parts}
          read={read}
          f={f}
          name={shared}
          onMore={onMore}
        />
      </div>
    )
  const showEnglish = mode === 0 && english && f.lang !== "fr"
  return (
    <div className={styles.test} data-mode={mode} ref={ref}>
      <figure className={styles.claim} style={shared("doc-claim")}>
        <blockquote
          lang={showEnglish ? "en" : "fr"}
          className={styles.claimText}
        >
          {showEnglish ? (
            `“${th.test.translation}”`
          ) : (
            <>
              «&nbsp;
              {segs.map(s =>
                s.parts.length && mode === 1 ? (
                  <span
                    key={s.k}
                    className={styles.claimPart}
                    data-parts={s.parts.join(" ")}
                    style={{ "--i": s.parts[0] }}
                  >
                    {s.text}
                  </span>
                ) : (
                  <span key={s.k}>{s.text}</span>
                ),
              )}
              &nbsp;»
            </>
          )}
        </blockquote>
        {mode === 0 ? (
          <figcaption className={styles.claimCite}>
            <span>
              {x.factcheck?.claimant
                ? say(f, x.factcheck.claimant)
                : fc.claimant}{" "}
              · {day(f, fc.date)}
            </span>
            <Verdict
              rating={fc.rating}
              publisher={fc.publisher}
              url={fc.url}
              f={f}
            />
            {f.lang !== "fr" ? (
              <button
                type="button"
                className={styles.expand}
                aria-pressed={english}
                onClick={() => setEnglish(e => !e)}
              >
                {english ? "Original French" : "Read in English"}
              </button>
            ) : null}
          </figcaption>
        ) : null}
      </figure>
      {mode === 1 ? (
        <>
          <ol className={styles.partNotes}>
            {parts.map((p, i) => (
              <li key={i} data-part={i} style={{ "--i": i }}>
                <span className={styles.partQ} style={shared(`part-${i}`)}>
                  {say(f, p.q)}
                </span>
                <span className={styles.partD}>{say(f, p.d)}</span>
              </li>
            ))}
          </ol>
          {lines.length ? (
            <svg className={styles.partLines} aria-hidden="true">
              {lines.map(l => (
                <path
                  key={l.i}
                  style={{ "--i": l.i }}
                  pathLength="1"
                  d={`M ${l.x1} ${l.y1} C ${l.x1} ${(l.y1 + l.y2) / 2}, ${l.x2} ${(l.y1 + l.y2) / 2}, ${l.x2} ${l.y2}`}
                />
              ))}
            </svg>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/* ---------- the evidence ---------- */

// Each row's verdict on the question the finding asks: was a rate cut, and when
const statusOf = (r, weeks, f) => {
  const m = r.measure
  if (!m) return { text: f.L(["Aucun changement de taux", "No rate change"]) }
  const month = m.from.length === 7
  const when = month
    ? f.date(`${m.from}-01`, { month: "long" })
    : f.date(m.from, { day: "numeric", month: "long" })
  const after = m.from > weeks.claim
  const text =
    f.lang === "fr"
      ? `Baissé ${month ? "en" : "le"} ${when}${after ? ", après l'affirmation" : ""}`
      : `Cut ${month ? "in" : "on"} ${when}${after ? ", after the claim" : ""}`
  return { text, cut: !after, url: m.source[1] }
}

// `name` carries the definitions into the chart's headers in the story; the
// same chart in "Behind the story" doesn't travel
export const Evidence = ({
  topic,
  parts,
  read,
  f,
  name = () => undefined,
  onMore,
}) => {
  const { data, nb, cut, fell, rose } = read
  const [split, setSplit] = React.useState(false)
  const [panel, setPanel] = React.useState(null)
  // the neighbours, from the largest fall; France last, for reference
  const rows = [
    ...[...nb].sort((a, b) => a.claim - a.before - (b.claim - b.before)),
    ...data.rows.filter(r => r.geo === "FR"),
  ]
  const lo = 0.4
  const hi = 1.1
  const x = v => `${((v - lo) / (hi - lo)) * 100}%`
  const dlo = -0.3
  const dhi = 0.15
  const dx = v => `${((v - dlo) / (dhi - dlo)) * 100}%`
  const zero = dx(0)
  const ticks = split ? [-0.3, -0.2, -0.1, 0, 0.1] : [0.4, 0.6, 0.8, 1.0]
  const words = WORD[f.lang === "fr" ? "fr" : "en"]
  const part = i => say(f, parts[i].head)
  const L = FINDINGS.labels
  const toggle = k => setPanel(p => (p === k ? null : k))
  return (
    <div className={styles.evidence}>
      <h3 className={styles.finding} style={name("doc-claim")}>
        {say(f, FINDINGS.headline, {
          n: words[cut.length],
          of: words[nb.length],
          who: names(f, cut, NAMED),
        })}
      </h3>
      <div className={styles.chartBlock}>
        <div className={styles.chartHead} aria-hidden="true">
          <span style={name("part-0")}>{part(0)}</span>
          <span className={styles.chartHeadMid}>
            <b style={name("part-3")}>{part(3)}</b>{" "}
            <b style={name("part-4")}>{part(4)}</b>
            {split ? (
              <span className={styles.chartKey}>
                <span>
                  <i className={styles.kPrice} />
                  {f.L(["La TVA suit le prix", "VAT following the price"])}
                </span>
                <span>
                  <i className={styles.kRate} />
                  {f.L(["Taux modifiés", "Rates changed"])}
                </span>
                <span>
                  <i className={styles.kNet} />
                  {f.L(["Total", "Net"])}
                </span>
              </span>
            ) : (
              <span className={styles.chartKey} style={name("part-1")}>
                <span>
                  <i className={styles.kBefore} />
                  {day(f, data.weeks.before)}
                </span>
                <span>
                  <i className={styles.kClaim} />
                  {day(f, data.weeks.claim)}
                </span>
              </span>
            )}
          </span>
          <span className={styles.chartHeadN}>
            {split
              ? f.L(["Effet des taux", "Rate effect"])
              : f.L(["Écart", "Change"])}
          </span>
          <span style={name("part-2")}>{part(2)}</span>
        </div>
        <ol className={styles.rows} data-split={split ? "" : undefined}>
          {rows.map((r, i) => {
            const d = r.claim - r.before
            const a = Math.min(r.before, r.claim)
            const b = Math.max(r.before, r.claim)
            const ref = r.geo === "FR"
            const st = statusOf(r, data.weeks, f)
            return (
              <li
                key={r.geo}
                className={ref ? styles.isRef : ""}
                style={{ "--i": i }}
                data-cut={st.cut ? "" : undefined}
              >
                <span className={styles.rowName}>
                  {f.L(COUNTRY[r.geo])}
                  {ref ? (
                    <small>{f.L(["pour référence", "for reference"])}</small>
                  ) : null}
                </span>
                <span
                  className={styles.track}
                  role="img"
                  aria-label={
                    split
                      ? `${f.L(COUNTRY[r.geo])} : ${f.L(["prix", "price"])} ${signed(f, r.price)}, ${f.L(["taux", "rates"])} ${signed(f, r.rate)}`
                      : `${f.L(COUNTRY[r.geo])} : ${eur(f, r.before)} → ${eur(f, r.claim)}`
                  }
                >
                  {ticks.map(t => (
                    <i
                      key={t}
                      className={styles.grid}
                      style={{ left: split ? dx(t) : x(t) }}
                    />
                  ))}
                  {split ? (
                    <>
                      <i className={styles.zero} style={{ left: zero }} />
                      <i
                        className={styles.segPrice}
                        style={{
                          left: zero,
                          width: `calc(${dx(r.price)} - ${zero})`,
                        }}
                      />
                      {r.rate < -0.005 ? (
                        <i
                          className={styles.segRate}
                          style={{
                            left: dx(r.rate),
                            width: `calc(${zero} - ${dx(r.rate)})`,
                          }}
                        />
                      ) : null}
                      <i className={styles.dotNet} style={{ left: dx(d) }} />
                    </>
                  ) : (
                    <>
                      <i
                        className={styles.span}
                        style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})` }}
                        data-down={d < 0 ? "" : undefined}
                      />
                      <i
                        className={styles.dotBefore}
                        style={{ left: x(r.before) }}
                      />
                      <i
                        className={styles.dotClaim}
                        style={{ left: x(r.claim) }}
                        data-down={d < 0 ? "" : undefined}
                      />
                    </>
                  )}
                </span>
                <span
                  className={styles.rowDelta}
                  data-down={(split ? r.rate : d) < -0.005 ? "" : undefined}
                >
                  {split ? signed(f, r.rate) : signed(f, d)}
                </span>
                <span className={styles.rowStatus}>{st.text}</span>
              </li>
            )
          })}
        </ol>
        <div className={styles.axis} aria-hidden="true">
          <span className={styles.axisTrack}>
            {ticks.map(t => (
              <span key={t} style={{ left: split ? dx(t) : x(t) }}>
                {split ? (t === 0 ? "0" : signed(f, t)) : eur(f, t, 1)}
              </span>
            ))}
          </span>
        </div>
        <p className={styles.caveat}>{say(f, FINDINGS.caveat)}</p>
      </div>
      <div className={styles.depth}>
        <div className={styles.depthLinks}>
          {[
            ["cut", L.cut],
            ["measures", L.measures],
            ["open", L.open],
            ["method", L.method],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-expanded={panel === k}
              onClick={() => toggle(k)}
            >
              {say(f, label)}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={split}
            onClick={() => setSplit(s => !s)}
          >
            {split
              ? f.L(["Revenir à la taxe par litre", "Back to tax per litre"])
              : say(f, L.split)}
          </button>
          {onMore ? (
            <button type="button" onClick={onMore}>
              {f.L(["Derrière l'histoire", "Behind the story"])} →
            </button>
          ) : null}
        </div>
        {panel ? (
          <div className={styles.depthPanel}>
            {panel === "cut" ? (
              <>
                <p>
                  {say(f, FINDINGS[topic].established, {
                    fell: `${names(f, fell, IN)} (${fell.map(r => signed(f, r.claim - r.before)).join(", ")})`,
                    rose: names(f, rose, IN),
                  })}
                </p>
                <p>{say(f, FINDINGS[topic].suggested)}</p>
              </>
            ) : null}
            {panel === "measures" ? (
              <ul>
                {rows.map(r => (
                  <li key={r.geo}>
                    <b>{f.L(COUNTRY[r.geo])}</b>{" "}
                    {r.measure ? (
                      <Ext href={r.measure.source[1]}>
                        {f.L(r.measure.what)}
                      </Ext>
                    ) : (
                      f.L([
                        "Aucune mesure trouvée ; la part fixe de la taxe reste plate.",
                        "No measure found; the fixed part of the tax stays flat.",
                      ])
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            {panel === "open" ? <p>{say(f, FINDINGS[topic].open)}</p> : null}
            {panel === "method" ? (
              <>
                <p>{say(f, FINDINGS.method)}</p>
                <p>
                  {f.L(["Taux normaux de TVA : ", "Standard VAT rates: "])}
                  {Object.entries(data.vat)
                    .map(
                      ([g, v]) =>
                        `${f.L(COUNTRY[g])} ${f.num(v * 100)}${f.lang === "fr" ? " %" : "%"}`,
                    )
                    .join(" · ")}
                  .{" "}
                  <Ext href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en">
                    {f.L(data.source)}
                  </Ext>
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
