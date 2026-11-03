import * as React from "react"

import BAROMETERS from "./data/topics.json"
import { NOTES, dots, say } from "./story-copy"
import { shared, still, useArrived, useCount } from "./story-motion"
import { Debates } from "./story-follow"
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

// One composition from the question to the debates. The people keep the left
// slot; "Cost of living" holds one place on the right; what is beneath it changes
// in place: the other answers, then the other concerns, then the debates.
//   mode 0 the narrator, 1 the question, 2 the answers, 3 the concerns,
//   4 the debates
export const Interview = ({
  mode,
  topic,
  narration,
  onPick,
  f,
  total,
  onAnswers,
  onTopics,
  onTexts,
}) => {
  const ask = ASK[f.lang] || ASK.en
  const answers = answersFor(f.lang)
  const first = answers[0]
  // the answers are said first, then one comes forward with its figure (the
  // beat's own sequence, after the reader's click)
  const emerged = useArrived(1700, mode === 2) && mode === 2
  const pose = Math.min(mode, 2)
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
      <div
        className={styles.street}
        style={shared(mode === 4 ? "scene-img" : null)}
      >
        <div className={styles.disc} aria-hidden="true" />
        {STREET.map(([src, alt], k) => (
          <img
            key={src}
            src={src}
            alt={k === pose ? f.L(alt) : ""}
            width="900"
            height="1125"
            className={k === pose ? styles.isFrame : undefined}
            aria-hidden={k === pose ? undefined : "true"}
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
      {mode >= 2 ? (
        <div
          className={`${styles.composition} ${emerged || mode > 2 ? styles.isEmerged : ""}`}
          data-mode={mode}
        >
          <div className={styles.anchor}>
            <span className={styles.anchorWords}>
              <span
                className={styles.anchorLong}
                lang={f.lang === "fr" ? "fr" : "en"}
                aria-hidden={mode > 2 ? "true" : undefined}
              >
                {dots(first.text)}
              </span>
              <h3
                className={styles.anchorName}
                aria-hidden={mode > 2 ? undefined : "true"}
                style={shared(mode === 4 ? "topic-title" : null)}
              >
                {f.L(TOPICS[topic].name)}
              </h3>
            </span>
            <span
              className={styles.answerN}
              aria-hidden={emerged ? undefined : "true"}
            >
              {emerged ? <Figure to={first.share} delay={120} f={f} /> : null}
              {emerged ? (f.lang === "fr" ? " %" : "%") : null}
            </span>
          </div>
          <div className={styles.layers}>
            <div className={styles.layer} data-on={mode === 2 ? "" : undefined}>
              <ol
                className={styles.answers}
                lang={f.lang === "fr" ? "fr" : "en"}
                aria-label={f.L(["Les autres réponses", "The other answers"])}
              >
                {answers.slice(1).map((a, i) => (
                  <li
                    key={a.text}
                    className={styles.answer}
                    style={{
                      "--i": i + 1,
                      "--o": `${LOOSE[(i + 1) % LOOSE.length]}px`,
                    }}
                  >
                    <span className={styles.answerText}>{dots(a.text)}</span>
                  </li>
                ))}
              </ol>
              <span className={styles.answerSay}>
                {say(f, f.lang === "fr" ? NOTES.answerIpsos : NOTES.answerEB)}{" "}
                <button
                  type="button"
                  className={styles.inlineButton}
                  onClick={onAnswers}
                >
                  {f.L(["Toutes les réponses", "Every answer"])} →
                </button>
              </span>
            </div>
            <div className={styles.layer} data-on={mode === 3 ? "" : undefined}>
              <p className={styles.lead}>{mode === 3 ? narration : null}</p>
              <TopicIndex
                mode="field"
                topic={topic}
                onPick={onPick}
                f={f}
                onMore={onTopics}
              />
            </div>
            <div className={styles.layer} data-on={mode === 4 ? "" : undefined}>
              <p className={styles.lead}>{mode === 4 ? narration : null}</p>
              <Debates
                topic={topic}
                f={f}
                total={total}
                onMore={onTexts}
                live={mode === 4}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ---------- the field of concerns ---------- */

// The other concerns, beneath the one followed: one size, because size would say
// something the data doesn't, in an order that carries no rank.
const FIELD = [
  "health",
  "education",
  "public",
  "immigration",
  "social",
  "economy",
  "cost",
  "world",
  "environment",
  "security",
  "jobs",
]

//   mode "field": the concerns other than the followed one, which stays above
//                 them; any measurable one can be chosen instead
//   mode "index": the closing list of other concerns, the same names
export const TopicIndex = ({ mode, topic, onPick, f, onMore }) => {
  const entry = key => {
    const t = TOPICS[key]
    const measurable = t.measurable !== false
    const chosen = key === topic
    const label = <span className={styles.fieldName}>{f.L(t.name)}</span>
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
        {FIELD.filter(k => k !== topic).map(entry)}
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
