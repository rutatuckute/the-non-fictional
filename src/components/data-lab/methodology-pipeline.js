import * as React from "react"

import {
  BAROMETER_LIST,
  DEBATE,
  EXCEPTION,
  PRODUCER_LIST,
  QUESTION_LIST,
  SAID,
  SOURCE_COUNTS,
  SUBJECT_COUNT,
  TOPIC_LIST,
} from "./method-data"
import { KEPT, TOPICS } from "./topics"
import styles from "./pipeline.module.css"

// Method and sources at a glance: five stages in one row, each with its
// number, a small glyph and one line, so the whole method reads at once.
// Pressing a stage opens what it holds underneath; from there the reader can
// open the full detail of how it was done. Nothing moves until they press.

const kept = TOPIC_LIST.filter(t => t.status === "kept")
const exception = TOPIC_LIST.filter(t => t.status === "exception")
const out = TOPIC_LIST.filter(t => t.status === "out")
const ready = QUESTION_LIST.filter(q => q.ready)
const DEBATE_ROWS = KEPT.filter(t => DEBATE[t])
const FAMILIES = [
  [
    "parliament",
    ["Assemblée nationale", "Assemblée nationale"],
    ["questions au gouvernement", "questions to the government"],
  ],
  [
    "government",
    ["Gouvernement", "Government"],
    ["déclarations", "statements"],
  ],
  [
    "factchecks",
    ["Vérificateurs", "Fact-checkers"],
    ["vérifications", "fact-checks"],
  ],
]

const Dot = ({ ready: on, title }) => (
  <i className={`${styles.dot} ${on ? styles.isReady : ""}`} title={title} />
)

/* ---------- the small glyphs ---------- */
const GLYPHS = {
  concerns: () =>
    [0, 1, 2].map(i => (
      <circle key={i} cx={15 + i * 30} cy={12} r={9} className={styles.gInk} />
    )),
  topics: () =>
    TOPIC_LIST.map((t, i) => (
      <rect
        key={t.id}
        x={(i % 8) * 11 + 1}
        y={Math.floor(i / 8) * 12 + 1}
        width={9}
        height={9}
        rx={2}
        className={
          t.status === "kept"
            ? styles.gInk
            : t.status === "exception"
              ? styles.gDash
              : styles.gFaint
        }
      />
    )),
  debate: () => {
    const max = Math.max(...FAMILIES.map(([k]) => SOURCE_COUNTS[k]))
    return FAMILIES.map(([k], i) => (
      <rect
        key={k}
        x={0}
        y={i * 8 + 1}
        width={Math.max(3, (SOURCE_COUNTS[k] / max) * 88)}
        height={5}
        rx={2}
        className={styles.gInk}
      />
    ))
  },
  questions: () =>
    QUESTION_LIST.map((q, i) => (
      <circle
        key={q.id}
        cx={(i % 12) * 7.5 + 4}
        cy={Math.floor(i / 12) * 11 + 6}
        r={3}
        className={styles.gInk}
      />
    )),
  data: () => (
    <>
      <rect
        x={0}
        y={8}
        width={88}
        height={8}
        rx={3}
        className={styles.gFaint}
      />
      <rect
        x={0}
        y={8}
        width={(ready.length / QUESTION_LIST.length) * 88}
        height={8}
        rx={3}
        className={styles.gForm}
      />
    </>
  ),
}

/* ---------- the stages ---------- */
const STAGES = f => [
  {
    id: "concerns",
    n: "01",
    title: ["Préoccupations", "Concerns"],
    big: "3",
    unit: ["baromètres", "barometers"],
    line: [
      "Ce qui inquiète les Français, selon trois enquêtes.",
      "What worries people in France, according to three surveys.",
    ],
    more: [
      "Voir le classement de chaque baromètre",
      "See each barometer's ranking",
    ],
  },
  {
    id: "topics",
    n: "02",
    title: ["Sujets", "Topics"],
    big: `${kept.length} + ${exception.length}`,
    unit: ["sujets", "topics"],
    line: [
      "Retenus s'ils sont dans le top 10 de deux baromètres sur trois.",
      "Kept if they are in the top 10 of two barometers out of three.",
    ],
    more: ["Voir la règle étape par étape", "See the rule step by step"],
  },
  {
    id: "debate",
    n: "03",
    title: ["Débat public", "Public debate"],
    big: f.num(SAID),
    unit: ["prises de parole", "public statements"],
    line: [
      "Assemblée, gouvernement, vérificateurs, d'octobre à octobre.",
      "Assemblée, government, fact-checkers, October to October.",
    ],
    more: [
      `Voir les ${SUBJECT_COUNT} sujets précis et leur classement`,
      `See the ${SUBJECT_COUNT} specific subjects and their ranking`,
    ],
  },
  {
    id: "questions",
    n: "04",
    title: ["Questions", "Questions"],
    big: `${QUESTION_LIST.length}`,
    unit: ["questions", "questions"],
    line: [
      `Les sujets précis les plus débattus, parmi ${SUBJECT_COUNT}.`,
      `The most debated specific subjects, out of ${SUBJECT_COUNT}.`,
    ],
    more: [
      "Voir comment chaque question a été choisie",
      "See how each question was chosen",
    ],
  },
  {
    id: "data",
    n: "05",
    title: ["Données", "Data"],
    big: `${PRODUCER_LIST.length}`,
    unit: ["producteurs officiels", "official producers"],
    line: [
      `${ready.length} questions déjà chiffrées, ${QUESTION_LIST.length - ready.length} en préparation.`,
      `${ready.length} questions already answered with data, ${QUESTION_LIST.length - ready.length} in preparation.`,
    ],
    more: ["Voir toutes les sources", "See every source"],
  },
]

/* ---------- what each stage holds ---------- */
const Concerns = ({ f }) => (
  <>
    <p className={styles.lede}>
      {f.L([
        "Les sujets ne sont pas choisis par nous : ils viennent de trois baromètres qui demandent aux Français ce qui les préoccupe le plus.",
        "We don't choose the topics: they come from three barometers that ask people in France what concerns them most.",
      ])}
    </p>
    <div className={styles.cards}>
      {BAROMETER_LIST.map(b => (
        <div className={styles.card} key={b.id}>
          <span className={styles.label}>{f.L(b.kind)}</span>
          <span className={styles.cardTitle}>{b.name}</span>
          <span className={styles.meta}>
            {b.by} · {b.waveCount}{" "}
            {f.L(b.waveCount > 1 ? ["vagues", "waves"] : ["vague", "wave"])}
          </span>
          <span className={styles.quote}>{b.question}</span>
        </div>
      ))}
    </div>
  </>
)

const Chips = ({ label, list, kind, f }) => (
  <div className={styles.chips}>
    <span className={`${styles.label} ${styles.chipsLabel}`}>{label}</span>
    {list.map(t => (
      <span className={`${styles.chip} ${styles[kind]}`} key={t.id}>
        {f.L(TOPICS[t.id].name)} · {t.count}/3
      </span>
    ))}
  </div>
)

const Topics = ({ f }) => (
  <>
    <p className={styles.lede}>
      {f.L([
        "Un sujet est retenu s'il figure dans le top 10 d'au moins deux baromètres sur trois.",
        "A topic is kept if it is in the top 10 of at least two barometers out of three.",
      ])}
    </p>
    <Chips
      f={f}
      kind="isKept"
      list={kept}
      label={f.L([`Retenus · ${kept.length}`, `Kept · ${kept.length}`])}
    />
    <Chips
      f={f}
      kind="isException"
      list={exception}
      label={f.L([
        `Par exception · ${exception.length}`,
        `As an exception · ${exception.length}`,
      ])}
    />
    <p className={`${styles.meta} ${styles.note}`}>
      {f.L([
        `L'éducation n'atteint le top 10 que d'un baromètre, mais elle est très débattue : ${EXCEPTION.parliament} questions au gouvernement, ${EXCEPTION.government} déclarations. Les vagues ont surtout été réalisées avant le mouvement lycéen.`,
        `Education reaches the top 10 of only one barometer, yet it is heavily debated: ${EXCEPTION.parliament} questions to the government, ${EXCEPTION.government} statements. Most waves were carried out before the lycéen movement.`,
      ])}
    </p>
    <Chips
      f={f}
      kind="isOut"
      list={out}
      label={f.L([`Écartés · ${out.length}`, `Left out · ${out.length}`])}
    />
  </>
)

const Debate = ({ f }) => {
  const max = Object.fromEntries(
    FAMILIES.map(([k]) => [k, Math.max(...DEBATE_ROWS.map(t => DEBATE[t][k]))]),
  )
  return (
    <>
      <p className={styles.lede}>
        {f.L([
          "Pour chaque sujet, tout ce qui a été dit en public d'octobre 2025 à octobre 2026, par trois familles de sources.",
          "For each topic, everything said in public from October 2025 to October 2026, across three families of sources.",
        ])}
      </p>
      <div className={styles.bars}>
        <div className={`${styles.barRow} ${styles.barHead}`}>
          <span />
          {FAMILIES.map(([k, name, what]) => (
            <span className={styles.family} key={k}>
              <span className={styles.bigSm}>{f.num(SOURCE_COUNTS[k])}</span>
              <span className={styles.cardTitle}>{f.L(name)}</span>
              <span className={styles.meta}>{f.L(what)}</span>
            </span>
          ))}
        </div>
        {DEBATE_ROWS.map(t => (
          <div className={styles.barRow} key={t}>
            <span className={styles.barName}>{f.L(TOPICS[t].name)}</span>
            {FAMILIES.map(([k, name]) => (
              <span
                className={styles.bar}
                key={k}
                aria-label={`${f.L(name)} : ${DEBATE[t][k]}`}
              >
                <i style={{ width: `${(DEBATE[t][k] / max[k]) * 100}%` }} />
                <b>{f.num(DEBATE[t][k])}</b>
              </span>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

const Questions = ({ f }) => {
  const topics = KEPT.filter(t => QUESTION_LIST.some(q => q.topic === t))
  return (
    <>
      <p className={styles.lede}>
        {f.L([
          "Dans chaque sujet, les sujets précis les plus débattus, par le plus de familles de sources et de groupes de l'Assemblée, deviennent des questions formulées pour que chacun puisse les accepter.",
          "Within each topic, the most debated specific subjects, by the most source families and Assemblée groups, become questions worded so that anyone can accept them.",
        ])}
      </p>
      <div className={styles.qgrid}>
        {topics.map(t => (
          <div className={styles.qcol} key={t}>
            <span className={styles.label}>{f.L(TOPICS[t].name)}</span>
            {QUESTION_LIST.filter(q => q.topic === t).map(q => (
              <span className={styles.q} key={q.id}>
                <Dot ready={q.ready} />
                {f.L(q.q)}
              </span>
            ))}
          </div>
        ))}
      </div>
      <Legend f={f} />
    </>
  )
}

const Legend = ({ f }) => (
  <p className={`${styles.meta} ${styles.legend}`}>
    <span>
      <Dot ready /> {f.L(["chiffrée", "answered with data"])}
    </span>
    <span>
      <Dot /> {f.L(["en préparation", "in preparation"])}
    </span>
  </p>
)

const Data = ({ f }) => (
  <>
    <p className={styles.lede}>
      {f.L([
        "Chaque question est confrontée à une série officielle, avec sa source, sa fréquence et ce qu'elle ne dit pas.",
        "Each question is set against an official series, with its source, how often it is updated and what it doesn't say.",
      ])}
    </p>
    <div className={styles.producers}>
      {PRODUCER_LIST.map(p => (
        <div className={styles.producer} key={p.name[0]}>
          <span className={styles.cardTitle}>{f.L(p.name)}</span>
          <span className={styles.pdots}>
            {p.questions.map(q => (
              <Dot key={q.id} ready={q.ready} title={f.L(q.q)} />
            ))}
          </span>
          <span className={styles.meta}>
            {p.questions.length}{" "}
            {f.L(
              p.questions.length > 1
                ? ["questions", "questions"]
                : ["question", "question"],
            )}
          </span>
        </div>
      ))}
    </div>
    <Legend f={f} />
  </>
)

// Every question with the series that answers it, for the "every source" view.
export const SourceList = ({ f }) => (
  <table className={styles.table}>
    <thead>
      <tr>
        <th>{f.L(["Question", "Question"])}</th>
        <th>{f.L(["Source", "Source"])}</th>
        <th>{f.L(["Fréquence", "Frequency"])}</th>
        <th>{f.L(["État", "Status"])}</th>
      </tr>
    </thead>
    {KEPT.filter(t => QUESTION_LIST.some(q => q.topic === t)).map(t => (
      <tbody key={t}>
        <tr className={styles.topicRow}>
          <th colSpan={4}>{f.L(TOPICS[t].name)}</th>
        </tr>
        {QUESTION_LIST.filter(q => q.topic === t).map(q => (
          <tr key={q.id}>
            <td>{f.L(q.q)}</td>
            <td>{q.source}</td>
            <td>{f.L(q.cadence)}</td>
            <td>
              <Dot ready={q.ready} />{" "}
              {f.L(
                q.ready
                  ? ["chiffrée", "answered with data"]
                  : ["en préparation", "in preparation"],
              )}
            </td>
          </tr>
        ))}
      </tbody>
    ))}
  </table>
)

const DETAIL = {
  concerns: Concerns,
  topics: Topics,
  debate: Debate,
  questions: Questions,
  data: Data,
}

export default function MethodPipeline({ f, deep }) {
  const [open, setOpen] = React.useState(null)
  const [deeper, setDeeper] = React.useState(false)
  const stages = STAGES(f)
  const stage = stages.find(s => s.id === open)
  const Detail = open ? DETAIL[open] : null
  const choose = id => {
    setOpen(current => (current === id ? null : id))
    setDeeper(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.pipeline}>
        {stages.map((s, i) => (
          <React.Fragment key={s.id}>
            {i ? <span className={styles.arrow} aria-hidden="true" /> : null}
            <button
              type="button"
              className={styles.stage}
              aria-expanded={open === s.id}
              aria-controls="method-stage"
              onClick={() => choose(s.id)}
            >
              <span className={styles.stageN}>{s.n}</span>
              <span className={styles.stageTitle}>{f.L(s.title)}</span>
              <span className={styles.stageBig}>{s.big}</span>
              <span className={styles.stageUnit}>{f.L(s.unit)}</span>
              <svg
                className={styles.glyph}
                viewBox="0 0 90 24"
                aria-hidden="true"
                focusable="false"
              >
                {GLYPHS[s.id]()}
              </svg>
              <span className={styles.stageLine}>{f.L(s.line)}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {stage ? (
        <section
          className={styles.panel}
          id="method-stage"
          aria-label={`${stage.n} · ${f.L(stage.title)}`}
        >
          <div className={styles.panelHead}>
            <span className={`${styles.label} ${styles.isForm}`}>
              {stage.n} · {f.L(stage.title)}
            </span>
            <button
              type="button"
              className={styles.close}
              aria-label={f.L(["Fermer", "Close"])}
              onClick={() => choose(open)}
            >
              ×
            </button>
          </div>
          <Detail f={f} />
          <button
            type="button"
            className={styles.more}
            aria-expanded={deeper}
            onClick={() => setDeeper(d => !d)}
          >
            {deeper
              ? f.L(["Refermer le détail", "Close the detail"])
              : `${f.L(stage.more)} →`}
          </button>
          {deeper ? <div className={styles.deep}>{deep[open]}</div> : null}
        </section>
      ) : null}
    </div>
  )
}
