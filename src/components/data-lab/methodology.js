import * as React from "react"

import DATA from "./data/topics.json"
import MethodFlow from "./methodology-flow"
import MethodPipeline, { SourceList } from "./methodology-pipeline"
import MethodQuestions from "./methodology-questions"
import MethodSteps from "./methodology-steps"
import ORIGINS from "./data/origins.json"
import { BAROMETERS, ORDER } from "./barometers"
import { EXCEPTIONS, TOPICS } from "./topics"
import styles from "./methodology.module.css"

// Method and sources. The five stages of the method at a glance; each opens
// to what it holds, and from there to the full detail of how it was done. The
// whole chain, as one picture, opens on its own.
//
// The barometer-by-barometer grid is one of those details: one row per
// candidate topic, one column per barometer, the rank the topic reached
// there, filled when it is in that barometer's top 10. The last column
// applies the rule. Pointing at a cell shows the barometer's own wording, its
// figures wave by wave and the page of the report they come from; choosing a
// barometer shows how it asks.

// Kept topics first, then the ones added by exception, then the ones left out.
const rank = t => (DATA.decision[t].in ? 0 : EXCEPTIONS.includes(t) ? 1 : 2)
const ROWS = Object.keys(DATA.decision).sort(
  (a, b) =>
    rank(a) - rank(b) ||
    DATA.decision[b].count - DATA.decision[a].count ||
    DATA.decision[b].countMax - DATA.decision[a].countMax,
)
const itemsOf = (topic, barometer) =>
  DATA.items
    .filter(it => it.topic === topic && it.barometer === barometer)
    .sort((a, b) => a.rank - b.rank)

const Badge = ({ items }) => {
  if (!items.length) return <span className={styles.none}>—</span>
  const best = items[0]
  const uncertain = best.rank !== best.rankHigh
  const top = Math.max(best.rank, best.rankHigh) <= DATA.rule.top
  const label = uncertain
    ? `${Math.min(best.rank, best.rankHigh)}–${Math.max(best.rank, best.rankHigh)}`
    : best.rank
  return (
    <span
      className={`${styles.badge} ${top ? styles.isTop : ""} ${uncertain ? styles.isUncertain : ""}`}
    >
      {label}
    </span>
  )
}

const Waves = ({ item, barometer, f }) => {
  const max = Math.max(...item.waves.map(([, v]) => v ?? 0), 1)
  return (
    <div className={styles.waves}>
      {item.waves.map(([w, v]) => (
        <div className={styles.wave} key={w}>
          <span className={styles.waveName}>
            {f.L(BAROMETERS[barometer].waves[w])}
          </span>
          <span className={styles.waveTrack}>
            {v != null ? <i style={{ width: `${(v / max) * 100}%` }} /> : null}
          </span>
          <span className={styles.waveValue}>
            {v != null ? f.pct(v, 0) : f.L(["hors top 10", "not in top 10"])}
          </span>
        </div>
      ))}
    </div>
  )
}

const Sources = ({ barometer, f, home }) => (
  <ul className={styles.sources}>
    {home ? (
      <li>
        <a
          className={styles.source}
          href={barometer.url}
          target="_blank"
          rel="noopener"
        >
          {f.L(["Le baromètre", "The barometer"])}
        </a>
      </li>
    ) : null}
    {barometer.sources.map(([label, url]) => (
      <li key={url}>
        <a className={styles.source} href={url} target="_blank" rel="noopener">
          {f.L(label)}
        </a>
      </li>
    ))}
  </ul>
)

const Panel = ({ focus, f }) => {
  if (focus?.cell) {
    const { topic, barometer } = focus.cell
    const b = BAROMETERS[barometer]
    const items = itemsOf(topic, barometer)
    return (
      <div className={styles.panel}>
        <span className={styles.label}>{b.name}</span>
        <h4 className={styles.panelTitle}>{f.L(TOPICS[topic].name)}</h4>
        {items.length ? (
          items.map(it => (
            <div className={styles.item} key={it.item}>
              <p className={styles.itemName}>{it.item}</p>
              <p className={styles.meta}>
                {it.rank === it.rankHigh
                  ? f.L([
                      `${it.rank}e · ${f.pct(it.share)} en moyenne`,
                      `Ranked ${it.rank} · ${f.pct(it.share)} on average`,
                    ])
                  : f.L([
                      `${it.rank}e à ${it.rankHigh}e · entre ${f.pct(it.share)} et ${f.pct(it.shareHigh)} en moyenne`,
                      `Ranked ${it.rank} to ${it.rankHigh} · between ${f.pct(it.share)} and ${f.pct(it.shareHigh)} on average`,
                    ])}
              </p>
              <Waves item={it} barometer={barometer} f={f} />
            </div>
          ))
        ) : (
          <p className={styles.meta}>
            {f.L([
              "Ce sujet ne figure pas dans la liste de ce baromètre.",
              "This topic isn't on this barometer's list.",
            ])}
          </p>
        )}
        <Sources barometer={b} f={f} />
      </div>
    )
  }
  if (focus?.barometer) {
    const b = BAROMETERS[focus.barometer]
    return (
      <div className={styles.panel}>
        <span className={styles.label}>{f.L(b.kind)}</span>
        <h4 className={styles.panelTitle}>{b.name}</h4>
        <p className={styles.meta}>{b.by}</p>
        <p className={styles.question}>{b.question}</p>
        <dl className={styles.facts}>
          <dt>{f.L(["Réponses", "Answers"])}</dt>
          <dd>{f.L(b.answers)}</dd>
          {b.sample ? (
            <>
              <dt>{f.L(["Échantillon", "Sample"])}</dt>
              <dd>{f.L(b.sample)}</dd>
            </>
          ) : null}
          <dt>{f.L(["Vagues retenues", "Waves used"])}</dt>
          <dd>
            {Object.values(b.waves)
              .map(w => f.L(w))
              .join(" · ")}
          </dd>
        </dl>
        {b.note ? <p className={styles.meta}>{f.L(b.note)}</p> : null}
        <Sources barometer={b} f={f} home />
      </div>
    )
  }
  return (
    <div className={styles.panel}>
      <span className={styles.label}>
        {f.L(["Lire la grille", "Reading the grid"])}
      </span>
      <dl className={styles.key}>
        <dt>
          <span className={`${styles.badge} ${styles.isTop}`}>3</span>
        </dt>
        <dd>
          {f.L([
            "Rang dans le baromètre, dans son top 10",
            "Rank in the barometer, inside its top 10",
          ])}
        </dd>
        <dt>
          <span className={styles.badge}>14</span>
        </dt>
        <dd>{f.L(["Rang hors du top 10", "Rank outside the top 10"])}</dd>
        <dt>
          <span
            className={`${styles.badge} ${styles.isTop} ${styles.isUncertain}`}
          >
            10–11
          </span>
        </dt>
        <dd>
          {f.L([
            "Rang incertain : toutes les valeurs ne sont pas publiées",
            "Uncertain rank: not every value is published",
          ])}
        </dd>
        <dt>
          <span className={styles.none}>—</span>
        </dt>
        <dd>
          {f.L([
            "Absent de la liste du baromètre",
            "Not on the barometer's list",
          ])}
        </dd>
      </dl>
      <p className={styles.meta}>
        {f.L([
          "Survolez une case ou choisissez un baromètre.",
          "Point at a cell or choose a barometer.",
        ])}
      </p>
    </div>
  )
}

function BarometerGrid({ f }) {
  const [focus, setFocus] = React.useState(null)
  const [pinned, setPinned] = React.useState(null)
  const shown = focus || pinned
  const firstException = ROWS.findIndex(t => rank(t) === 1)
  const firstOut = ROWS.findIndex(t => rank(t) === 2)
  const ex = ORIGINS.exception.education
  const sameCell = (a, b) =>
    a?.cell &&
    b?.cell &&
    a.cell.topic === b.cell.topic &&
    a.cell.barometer === b.cell.barometer
  const pin = next =>
    setPinned(current =>
      sameCell(current, next) ||
      (current?.barometer && current.barometer === next.barometer)
        ? null
        : next,
    )

  return (
    <div className={styles.layout}>
      <div
        className={styles.grid}
        role="table"
        aria-label={f.L([
          "Rang de chaque sujet dans chaque baromètre",
          "Rank of each topic in each barometer",
        ])}
        onPointerLeave={() => setFocus(null)}
      >
        <div className={`${styles.row} ${styles.head}`} role="row">
          <span role="columnheader" className={styles.topicHead}>
            {f.L(["Sujet", "Topic"])}
          </span>
          {ORDER.map(b => (
            <span role="columnheader" key={b}>
              <button
                type="button"
                className={styles.barometer}
                aria-pressed={pinned?.barometer === b}
                onPointerEnter={() => setFocus({ barometer: b })}
                onFocus={() => setFocus({ barometer: b })}
                onBlur={() => setFocus(null)}
                onClick={() => pin({ barometer: b })}
              >
                <span className={styles.barometerName}>
                  {BAROMETERS[b].name}
                </span>
                <span className={styles.barometerShort} aria-hidden="true">
                  {BAROMETERS[b].short}
                </span>
                <span className={styles.barometerKind}>
                  {f.L(BAROMETERS[b].kind)}
                </span>
              </button>
            </span>
          ))}
          <span role="columnheader" className={styles.verdictHead}>
            {f.L(["Règle", "Rule"])}
          </span>
        </div>

        {ROWS.map((topic, index) => {
          const d = DATA.decision[topic]
          const exception = rank(topic) === 1
          return (
            <React.Fragment key={topic}>
              {index === firstException ? (
                <div className={styles.divider} role="row">
                  <span role="cell">
                    {f.L(["Ajouté par exception", "Added as an exception"])}
                  </span>
                  <p className={styles.exceptionNote}>
                    {f.L([
                      `L'éducation n'atteint le top 10 que d'un baromètre sur trois, mais elle est très débattue : ${ex.parliament} questions au gouvernement, de ${ex.groups} groupes sur 12, et ${ex.government} déclarations du gouvernement. L'écart tient en partie au calendrier : la plupart des vagues des baromètres ont été réalisées avant le mouvement lycéen de septembre 2026.`,
                      `Education reaches the top 10 of only one barometer in three, yet it is heavily debated: ${ex.parliament} questions to the government, from ${ex.groups} of 12 groups, and ${ex.government} government statements. The gap is partly a matter of timing: most barometer waves were carried out before the lycéen movement of September 2026.`,
                    ])}
                  </p>
                </div>
              ) : null}
              {index === firstOut ? (
                <div className={styles.divider} role="row">
                  <span role="cell">
                    {f.L(["Écartés par la règle", "Left out by the rule"])}
                  </span>
                </div>
              ) : null}
              <div
                className={`${styles.row} ${d.in || exception ? "" : styles.isOut}`}
                role="row"
              >
                <span role="rowheader" className={styles.topic}>
                  {f.L(TOPICS[topic].name)}
                  {TOPICS[topic].measurable === false ? (
                    <span className={styles.flag}>
                      {f.L(["non mesurable ici", "not measurable here"])}
                    </span>
                  ) : null}
                </span>
                {ORDER.map(b => {
                  const cell = { cell: { topic, barometer: b } }
                  return (
                    <span role="cell" key={b}>
                      <button
                        type="button"
                        className={`${styles.cell} ${sameCell(shown, cell) ? styles.isOn : ""}`}
                        aria-label={`${f.L(TOPICS[topic].name)} · ${BAROMETERS[b].name}`}
                        aria-pressed={sameCell(pinned, cell)}
                        onPointerEnter={() => setFocus(cell)}
                        onFocus={() => setFocus(cell)}
                        onBlur={() => setFocus(null)}
                        onClick={() => pin(cell)}
                      >
                        <Badge items={itemsOf(topic, b)} />
                      </button>
                    </span>
                  )
                })}
                <span role="cell" className={styles.verdict}>
                  <span className={styles.count}>{d.count}/3</span>
                  <span
                    className={d.in || exception ? styles.kept : styles.dropped}
                  >
                    {d.in
                      ? f.L(["Retenu", "Kept"])
                      : exception
                        ? f.L(["Exception", "Exception"])
                        : f.L(["Écarté", "Left out"])}
                  </span>
                </span>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      <aside className={styles.side} aria-live="polite">
        <Panel focus={shown} f={f} />
      </aside>
    </div>
  )
}

export default function Methodology({ f }) {
  const [flow, setFlow] = React.useState(false)
  return (
    <section
      className={styles.section}
      id="method"
      aria-labelledby="method-title"
    >
      <h2 className={styles.title} id="method-title">
        {f.L(["Méthode et sources", "Method and sources"])}
      </h2>
      <p className={styles.rule}>
        {f.L([
          "Des préoccupations aux données, en cinq étapes. Chacune s'ouvre pour montrer comment elle a été faite.",
          "From concerns to data, in five steps. Each one opens to show how it was done.",
        ])}
      </p>

      <MethodPipeline
        f={f}
        deep={{
          concerns: <BarometerGrid f={f} />,
          topics: <MethodSteps f={f} />,
          debate: <MethodQuestions f={f} part="table" />,
          questions: <MethodQuestions f={f} part="steps" />,
          data: <SourceList f={f} />,
        }}
      />

      <button
        type="button"
        className={styles.flowToggle}
        aria-expanded={flow}
        aria-controls="method-flow"
        onClick={() => setFlow(v => !v)}
      >
        {flow
          ? f.L(["Refermer la chaîne", "Close the chain"])
          : `${f.L(["Voir toute la chaîne", "See the whole chain"])} →`}
      </button>
      {flow ? (
        <div className={styles.flow} id="method-flow">
          <MethodFlow f={f} />
        </div>
      ) : null}
    </section>
  )
}
