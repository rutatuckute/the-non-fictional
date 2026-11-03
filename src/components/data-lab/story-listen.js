import * as React from "react"

import BAROMETERS from "./data/topics.json"
import { NOTES, dots, say } from "./story-copy"
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
  },
  fr: {
    q: "Parmi les enjeux suivants, quels sont les deux qui vous préoccupent le plus à titre personnel ?",
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

export const Interview = ({ mode, topic, f, onMore }) => {
  const ask = ASK[f.lang] || ASK.en
  const answers = answersFor(f.lang)
  const first = answers[0]
  // the answers are said first, then one comes forward with its figure (the
  // beat's own sequence, after the reader's click)
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
        // the question is to the left: the line leaves its first row and goes
        // over the interviewer's hat to the microphone
        b: [q.right - box.left + 16, q.top - box.top + 24],
        top: img.top - box.top - 26,
      })
    }
    // once the figures have settled in their new place
    const t = setTimeout(measure, still() ? 0 : 940)
    window.addEventListener("resize", measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", measure)
    }
  }, [mode, f.lang])
  const path = line
    ? `M ${line.b[0]} ${line.b[1]} C ${line.b[0] + 50} ${line.top}, ${line.a[0] - 40} ${line.top}, ${line.a[0]} ${line.a[1]}`
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
                {/* each topic's first answer becomes its name among the concerns */}
                <span
                  className={styles.answerText}
                  style={
                    answers.findIndex(x => x.topic === a.topic) === i &&
                    KEPT.includes(a.topic)
                      ? a.topic === topic
                        ? shared("topic-title")
                        : shared(`topic-${a.topic}`, "concern")
                      : undefined
                  }
                >
                  {dots(a.text)}
                </span>
                {i === 0 ? (
                  <span
                    className={styles.answerN}
                    aria-hidden={emerged ? undefined : "true"}
                  >
                    {emerged ? (
                      <Figure to={first.share} delay={120} f={f} />
                    ) : null}
                    {emerged ? (f.lang === "fr" ? " %" : "%") : null}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <span className={styles.answerSay}>
            {say(f, f.lang === "fr" ? NOTES.answerIpsos : NOTES.answerEB)}{" "}
            <button
              type="button"
              className={styles.inlineButton}
              onClick={onMore}
            >
              {f.L(["Toutes les réponses", "Every answer"])} →
            </button>
          </span>
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

//   mode "field": the followed topic in terracotta, carried in from the
//                 answers, the others gathered around it; any measurable topic
//                 can be chosen instead
//   mode "index": the closing list of other concerns, the same names
export const TopicIndex = ({ mode, topic, onPick, f, onMore }) => {
  const entry = key => {
    const t = TOPICS[key]
    const measurable = t.measurable !== false
    const chosen = key === topic
    const label = (
      <span
        className={styles.fieldName}
        style={
          mode === "field"
            ? chosen
              ? shared("topic-title")
              : shared(`topic-${key}`, "concern")
            : undefined
        }
      >
        {f.L(t.name)}
      </span>
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
      <div className={styles.fieldRows} role="list">
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
            <button
              type="button"
              className={styles.inlineButton}
              onClick={onMore}
            >
              {say(f, NOTES.method)} →
            </button>
          </p>
        </Disclosure>
      </div>
    </div>
  )
}
