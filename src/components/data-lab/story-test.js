import * as React from "react"

import TESTS from "./data/tests.json"
import THREADS from "./data/threads.json"
import { FINDINGS, TEST_PARTS, THREAD_EXTRAS, say } from "./story-copy"
import { shared, still } from "./story-motion"
import { Disclosure, Ext, Verdict, day } from "./story-parts"
import styles from "./narrative.module.css"

// What the data says. One claim comes back to the centre. Its words become the
// analysis: each measurable phrase is underlined and answered with the
// definition we chose, one click at a time. The definitions then move into the
// headers of the chart that tests them. The finding comes first, the chart proves
// it, and the chart's second state separates price from policy; everything else
// is under one disclosure.

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

// What each click brings out: a phrase with its questions (one phrase can hold
// two), in the same order whichever language the sentence is in
export const revealGroups = parts => {
  const groups = []
  parts.forEach((p, i) => {
    const last = groups.at(-1)
    if (last && parts[last[0]].text === p.text) last.push(i)
    else groups.push([i])
  })
  return groups
}

// the sentence, cut at its measurable phrases, in reading order
const segments = (text, parts, anchor) => {
  const marks = revealGroups(parts)
    .map(group => {
      const word = anchor(parts[group[0]])
      return { word, group, at: text.indexOf(word) }
    })
    .filter(m => m.at >= 0)
    .sort((a, b) => a.at - b.at)
  const out = []
  let from = 0
  for (const m of marks) {
    if (m.at > from) out.push({ text: text.slice(from, m.at), group: null })
    out.push({ text: m.word, group: m.group })
    from = m.at + m.word.length
  }
  if (from < text.length) out.push({ text: text.slice(from), group: null })
  return out
}

// One scene for the claim. reveal 0: the sentence alone, who said it, and the
// fact-checker's verdict. Each click then underlines a phrase and draws it to
// its definitions, until all are visible. Nothing moves to make room: the space
// for the definitions is held from the start. The sentence is in the reader's
// language, the original a click away.
//   mode "parts" | "evidence"
export const ClaimTest = ({ topic, mode, reveal = 0, f, onMore }) => {
  const th = THREADS[topic]
  const parts = TEST_PARTS[topic]
  const read = readTest(topic)
  const x = THREAD_EXTRAS[topic] || {}
  const ref = React.useRef(null)
  const [original, setOriginal] = React.useState(false)
  const translated = f.lang !== "fr" && !original
  const [lines, setLines] = React.useState([])
  React.useLayoutEffect(() => {
    if (mode !== "parts") return undefined
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
    measure()
    const t = setTimeout(measure, still() ? 0 : 80)
    window.addEventListener("resize", measure)
    document.fonts?.ready.then(measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", measure)
    }
  }, [mode, f.lang, original])
  if (!th?.test || !parts || !read) return null
  if (mode === "evidence")
    return (
      <div className={styles.test} data-mode="evidence" ref={ref}>
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
  const fc = th.factcheck
  const groups = revealGroups(parts)
  const shown = new Set(groups.slice(0, reveal).flat())
  const anchor = p => (translated ? p.textEn : p.text)
  const segs = segments(
    translated ? th.test.translation : th.test.claim,
    parts,
    anchor,
  )
  // the definitions, in the order their words come in the sentence
  const order = segs.flatMap(g => g.group || [])
  return (
    <div
      className={styles.test}
      data-mode="parts"
      data-reveal={reveal}
      ref={ref}
    >
      {f.lang !== "fr" ? (
        <span className={styles.claimTools}>
          {translated ? <span>Our translation</span> : null}
          <button
            type="button"
            className={styles.expand}
            aria-pressed={original}
            onClick={() => setOriginal(o => !o)}
          >
            {translated ? "Original French" : "English"}
          </button>
        </span>
      ) : null}
      <figure className={styles.claim}>
        <blockquote
          lang={translated ? "en" : "fr"}
          className={styles.claimText}
          style={shared("doc-claim")}
        >
          {translated ? "“" : "« "}
          {segs.map((g, k) =>
            g.group ? (
              <span
                key={k}
                data-parts={g.group.join(" ")}
                className={`${styles.claimPart} ${g.group.some(i => shown.has(i)) ? styles.isOn : ""}`}
              >
                {g.text}
              </span>
            ) : (
              <span key={k}>{g.text}</span>
            ),
          )}
          {translated ? "”" : " »"}
        </blockquote>
        <figcaption
          className={`${styles.claimCite} ${reveal ? styles.isGone : ""}`}
        >
          <span>
            {x.factcheck?.claimant ? say(f, x.factcheck.claimant) : fc.claimant}{" "}
            · {day(f, fc.date)}
          </span>
          <Verdict
            rating={fc.rating}
            publisher={fc.publisher}
            url={fc.url}
            f={f}
          />
        </figcaption>
      </figure>
      <ol className={styles.partNotes}>
        {order.map(i => (
          <li key={i} data-part={i} data-on={shown.has(i) ? "" : undefined}>
            <span
              className={styles.partQ}
              style={shown.has(i) ? shared(`part-${i}`) : undefined}
            >
              {say(f, parts[i].q)}
            </span>
            <span className={styles.partD}>{say(f, parts[i].d)}</span>
          </li>
        ))}
      </ol>
      <svg className={styles.partLines} aria-hidden="true">
        {lines
          .filter(l => shown.has(l.i))
          .map(l => (
            <path
              key={`${l.i}-${translated}`}
              pathLength="1"
              d={`M ${l.x1} ${l.y1} C ${l.x1} ${(l.y1 + l.y2) / 2}, ${l.x2} ${(l.y1 + l.y2) / 2}, ${l.x2} ${l.y2}`}
            />
          ))}
      </svg>
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
        {/* the chart's two states: the same marks, a different question */}
        <div
          className={styles.views}
          role="group"
          aria-label={f.L(["Vue du graphique", "Chart view"])}
        >
          <button
            type="button"
            aria-pressed={!split}
            onClick={() => setSplit(false)}
          >
            {say(f, L.total)}
          </button>
          <button
            type="button"
            aria-pressed={split}
            onClick={() => setSplit(true)}
          >
            {say(f, L.split)}
          </button>
        </div>
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
                  {/* the same marks in both states: the dumbbell's end
                      becomes the net change, its start closes on zero, and the
                      two causes open out of zero */}
                  <i
                    className={styles.zero}
                    data-off={split ? undefined : ""}
                    style={{ left: zero }}
                  />
                  <i
                    className={styles.segPrice}
                    data-off={split ? undefined : ""}
                    style={{
                      left: zero,
                      width: split ? `calc(${dx(r.price)} - ${zero})` : 0,
                    }}
                  />
                  <i
                    className={styles.segRate}
                    data-off={split && r.rate < -0.005 ? undefined : ""}
                    style={
                      split && r.rate < -0.005
                        ? {
                            left: dx(r.rate),
                            width: `calc(${zero} - ${dx(r.rate)})`,
                          }
                        : { left: zero, width: 0 }
                    }
                  />
                  <i
                    className={styles.span}
                    data-off={split ? "" : undefined}
                    style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})` }}
                    data-down={d < 0 ? "" : undefined}
                  />
                  <i
                    className={styles.dotBefore}
                    data-off={split ? "" : undefined}
                    style={{ left: split ? zero : x(r.before) }}
                  />
                  <i
                    className={styles.dotClaim}
                    data-net={split ? "" : undefined}
                    data-down={d < 0 ? "" : undefined}
                    style={{ left: split ? dx(d) : x(r.claim) }}
                  />
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
      <Disclosure label={say(f, L.about)} className={styles.about}>
        <h5>{say(f, L.cut)}</h5>
        <p>
          {say(f, FINDINGS[topic].established, {
            fell: `${names(f, fell, IN)} (${fell.map(r => signed(f, r.claim - r.before)).join(", ")})`,
            rose: names(f, rose, IN),
          })}
        </p>
        <p>{say(f, FINDINGS[topic].suggested)}</p>
        <h5>{say(f, L.measures)}</h5>
        <ul>
          {rows.map(r => (
            <li key={r.geo}>
              <b>{f.L(COUNTRY[r.geo])}</b>{" "}
              {r.measure ? (
                <Ext href={r.measure.source[1]}>{f.L(r.measure.what)}</Ext>
              ) : (
                f.L([
                  "Aucune mesure trouvée ; la part fixe de la taxe reste plate.",
                  "No measure found; the fixed part of the tax stays flat.",
                ])
              )}
            </li>
          ))}
        </ul>
        <h5>{say(f, L.open)}</h5>
        <p>{say(f, FINDINGS[topic].open)}</p>
        <h5>{say(f, L.method)}</h5>
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
        {onMore ? (
          <button type="button" className={styles.expand} onClick={onMore}>
            {f.L(["Derrière l'histoire", "Behind the story"])} →
          </button>
        ) : null}
      </Disclosure>
    </div>
  )
}
