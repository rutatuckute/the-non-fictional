import * as React from "react"

import BAROMETERS from "./data/topics.json"
import { NOTES, say } from "./story-copy"
import { shared, still, useArrived, useCount } from "./story-motion"
import { Disclosure } from "./story-parts"
import { KEPT, TOPICS } from "./topics"
import styles from "./narrative.module.css"

// What matters. One street interview, three voices: the narrator, the
// interviewer asking the survey's question, the public answering. One answer
// then comes forward with its figure, and carries into the field of concerns,
// where the topic the story follows emerges by itself.

// The question as each survey asks it, verbatim: in English the
// Eurobarometer's master text, in French Ipsos's own wording.
const ASK = {
  en: {
    q: "What do you think are the two most important issues facing France at the moment?",
    by: "Standard Eurobarometer, QA3",
  },
  fr: {
    q: "Parmi les enjeux suivants, quels sont les deux qui vous préoccupent le plus à titre personnel ?",
    by: "Ipsos BVA, Fractures françaises",
  },
}
// The answers to that question as it was asked, with their shares
const answersFor = lang =>
  BAROMETERS.items
    .filter(
      i => i.barometer === (lang === "fr" ? "fractures" : "eurobarometer"),
    )
    .sort((a, c) => a.rank - c.rank)
    .slice(0, lang === "fr" ? 10 : 9)
    .map(x => ({ text: x.item, topic: x.topic, share: x.share }))

// One engraving per voice, same framing, so they dissolve in place
const STREET = [
  [
    "/images/data-lab/street-1.webp",
    [
      "Gravure : dans la rue, une journaliste au chapeau, micro baissé, fait face à un jeune homme qui attend, les mains jointes.",
      "Engraving: in the street, a reporter in a hat, microphone lowered, faces a young man who waits, hands clasped.",
    ],
  ],
  [
    "/images/data-lab/street-2.webp?v=2",
    [
      "Gravure : la journaliste tend son micro au jeune homme, qui écoute la question.",
      "Engraving: the reporter holds out her microphone to the young man, who listens to the question.",
    ],
  ],
  [
    "/images/data-lab/street-3.webp",
    [
      "Gravure : le jeune homme répond, les mains ouvertes, au micro de la journaliste.",
      "Engraving: the young man answers, hands open, into the reporter's microphone.",
    ],
  ],
]
// where the microphone is in the engraving held out (share of its width,
// height)
const MIC = [0.57, 0.18]
// The answers arrive loose, as they are spoken: a fixed offset per line
const LOOSE = [0, 52, 20, 74, 8, 44, 86, 28, 62, 14]

const Figure = ({ to, delay, f }) => f.num(Math.round(useCount(to, delay, 900)))

export const Interview = ({ mode, f }) => {
  const ask = ASK[f.lang] || ASK.en
  const answers = answersFor(f.lang)
  const first = answers[0]
  // the answers are said first, then one comes forward (the beat's own
  // sequence, after the reader's click)
  const emerged = useArrived(1700, mode) && mode === 2
  const ref = React.useRef(null)

  // the fine line from the microphone to the question
  const [line, setLine] = React.useState(null)
  React.useLayoutEffect(() => {
    setLine(null)
    if (mode !== 1) return undefined
    const measure = () => {
      const box = ref.current?.getBoundingClientRect()
      const img = ref.current
        ?.querySelector('img[data-frame="1"]')
        ?.getBoundingClientRect()
      const q = ref.current
        ?.querySelector(`.${styles.ask}`)
        ?.getBoundingClientRect()
      if (!box || !img || !q || !q.width) return
      setLine({
        w: box.width,
        h: box.height,
        a: [
          img.left - box.left + img.width * MIC[0],
          img.top - box.top + img.height * MIC[1],
        ],
        b: [q.left - box.left - 14, q.top - box.top + 22],
      })
    }
    // once the figures have settled in their new place
    const t = setTimeout(measure, still() ? 0 : 760)
    window.addEventListener("resize", measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", measure)
    }
  }, [mode, f.lang])
  const path = line
    ? `M ${line.a[0]} ${line.a[1]} C ${line.a[0] + (line.b[0] - line.a[0]) * 0.55} ${line.a[1]}, ${line.b[0] - 40} ${line.b[1]}, ${line.b[0]} ${line.b[1]}`
    : null

  return (
    <div className={styles.interview} data-beat={mode} ref={ref}>
      <div className={styles.street}>
        <div className={styles.disc} aria-hidden="true" />
        {STREET.map(([src, alt], k) => (
          <img
            key={src}
            src={src}
            alt={k === mode ? f.L(alt) : ""}
            width="900"
            height="1125"
            className={k === mode ? styles.isFrame : undefined}
            aria-hidden={k === mode ? undefined : "true"}
            data-frame={k}
          />
        ))}
      </div>
      {mode === 1 ? (
        <div className={styles.askWrap}>
          <p className={styles.ask} lang={f.lang === "fr" ? "fr" : "en"}>
            {ask.q}
          </p>
          <span className={styles.askBy}>{ask.by}</span>
        </div>
      ) : null}
      {path ? (
        <svg
          className={styles.connector}
          width={line.w}
          height={line.h}
          viewBox={`0 0 ${line.w} ${line.h}`}
          aria-hidden="true"
        >
          <path d={path} pathLength="1" />
          <circle cx={line.a[0]} cy={line.a[1]} r="3" />
        </svg>
      ) : null}
      {mode === 2 ? (
        <div
          className={`${styles.answersWrap} ${emerged ? styles.isEmerged : ""}`}
        >
          <ol
            className={styles.answers}
            lang={f.lang === "fr" ? "fr" : "en"}
            aria-label={f.L(["Les réponses", "The answers"])}
          >
            {answers.map((a, i) => (
              <li
                key={a.text}
                className={`${styles.answer} ${i === 0 ? styles.isFirst : ""}`}
                style={{ "--i": i, "--o": `${LOOSE[i % LOOSE.length]}px` }}
              >
                <span
                  className={styles.answerText}
                  style={shared(a === first ? `topic-${a.topic}` : null)}
                >
                  {a.text}
                </span>
              </li>
            ))}
          </ol>
          <div
            className={styles.answerFigure}
            aria-hidden={emerged ? undefined : "true"}
          >
            <span className={styles.answerN}>
              {emerged ? <Figure to={first.share} delay={120} f={f} /> : null}
              {emerged ? (f.lang === "fr" ? " %" : "%") : null}
            </span>
            <span className={styles.answerSay}>
              {say(f, f.lang === "fr" ? NOTES.answerIpsos : NOTES.answerEB)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ---------- the field of concerns ---------- */

// The eleven concerns as an open typographic field: one size, because size
// would say something the data doesn't; placed for balance, not by rank.
const FIELD = [
  ["health", "education", "public"],
  ["immigration", "social"],
  ["economy", "cost"],
  ["world", "environment"],
  ["security", "jobs"],
]
const INDENT = [6, 0, 16, 3, 11]

// Every name carries its own identity in from the answers; once the followed
// topic has come forward, it carries the story on into its debates.
const FieldName = ({ k, name, carries }) => (
  <span
    className={styles.fieldName}
    style={shared(carries ? "topic-title" : `topic-${k}`)}
  >
    {name}
  </span>
)

//   mode "field": it assembles, then the followed topic comes forward by
//                 itself; any measurable topic can be chosen instead
//   mode "index": the closing list of other concerns, the same names
export const TopicIndex = ({ mode, topic, onPick, f }) => {
  const emerged = useArrived(1150, mode)
  const entry = key => {
    const t = TOPICS[key]
    const measurable = t.measurable !== false
    const chosen = key === topic
    const name = f.L(t.name)
    const label =
      mode === "field" ? (
        <FieldName k={key} name={name} carries={chosen && emerged} />
      ) : (
        <span className={styles.fieldName}>{name}</span>
      )
    const aside = !measurable
      ? f.L(["non mesuré ici", "not measured here"])
      : t.exception
        ? f.L(["ajouté", "added"])
        : null
    return (
      <span
        key={key}
        role="listitem"
        className={`${styles.fieldItem} ${chosen ? styles.isChosen : ""} ${measurable ? "" : styles.isUnmeasured}`}
        style={{ "--n": KEPT.indexOf(key) }}
      >
        {measurable ? (
          <button
            type="button"
            className={styles.fieldPick}
            aria-pressed={chosen}
            onClick={() => onPick(key)}
          >
            {label}
          </button>
        ) : (
          label
        )}
        {aside && mode === "field" ? <small>{aside}</small> : null}
      </span>
    )
  }
  if (mode === "index")
    return (
      <div className={styles.fieldIndex} role="list">
        {KEPT.filter(k => TOPICS[k].measurable !== false).map(entry)}
      </div>
    )
  return (
    <div className={styles.field}>
      <div
        className={`${styles.fieldRows} ${emerged ? styles.isEmerged : ""}`}
        role="list"
      >
        {FIELD.map((row, r) => (
          <div
            key={row[0]}
            role="none"
            className={styles.fieldRow}
            style={{ marginLeft: `${INDENT[r]}%` }}
          >
            {row.map(entry)}
          </div>
        ))}
      </div>
      <div className={styles.fieldFoot}>
        <span className={styles.fine}>{say(f, NOTES.change)}</span>
        <Disclosure label={say(f, NOTES.chosen)}>
          <p>
            {say(f, NOTES.rule)} {say(f, NOTES.exception)}{" "}
            {say(f, NOTES.unmeasured)}{" "}
            {f.L([
              "L'ordre et la place ne disent aucun rang.",
              "Order and position imply no ranking.",
            ])}{" "}
            <a href="#method" className={styles.inlineLink}>
              {say(f, NOTES.method)} →
            </a>
          </p>
        </Disclosure>
      </div>
    </div>
  )
}
