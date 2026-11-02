import * as React from "react"

import { BAROMETERS as SURVEYS, ORDER } from "./barometers"
import BAROMETERS from "./data/topics.json"
import THREADS from "./data/threads.json"
import { Corpus } from "./story-corpus"
import { NOTES, TEST_PARTS, THREAD_EXTRAS, say } from "./story-copy"
import { AngleExplorer } from "./story-follow"
import { TopicIndex } from "./story-listen"
import { Ext, TYPE_EN, Verdict, day } from "./story-parts"
import { Evidence, readTest } from "./story-test"
import styles from "./narrative.module.css"

// "Behind the story", in "Dig into the data": what the guided story edits out.
// Separating the two is the point: the story is one path through this material;
// nothing here is lost. Each part opens on demand (the heavy ones only load
// then), and the story can link straight to one.

// Every survey's answers, with their shares
const SurveyAnswers = ({ topic, f }) => (
  <>
    <p className={styles.fine}>{say(f, NOTES.answersEB)}</p>
    <div className={styles.surveys}>
      {ORDER.map(key => {
        const s = SURVEYS[key]
        const items = BAROMETERS.items
          .filter(i => i.barometer === key)
          .sort((a, b) => a.rank - b.rank)
        const max = Math.max(...items.map(i => i.share))
        return (
          <div key={key} className={styles.survey}>
            <h5>
              {key === "eurobarometer" && f.lang !== "fr"
                ? "Standard Eurobarometer"
                : s.name}
            </h5>
            <span className={styles.fine}>
              {s.by}
              {s.sample ? ` · ${f.L(s.sample)}` : ""} · {f.L(s.answers)}
            </span>
            <p
              className={styles.surveyQ}
              lang={key === "eurobarometer" ? "en" : "fr"}
            >
              {s.question}
            </p>
            <ol>
              {items.map(i => (
                <li key={i.item} data-on={i.topic === topic ? "" : undefined}>
                  <span lang={key === "eurobarometer" ? "en" : "fr"}>
                    {i.item}
                  </span>
                  <i
                    aria-hidden="true"
                    style={{ width: `${(i.share / max) * 100}%` }}
                  />
                  <b>
                    {f.num(Math.round(i.share))}
                    {f.lang === "fr" ? " %" : "%"}
                  </b>
                </li>
              ))}
            </ol>
            {s.note ? <p className={styles.fine}>{f.L(s.note)}</p> : null}
            <Ext href={s.url}>{f.L(["La source", "The source"])}</Ext>
          </div>
        )
      })}
    </div>
  </>
)

// The fact-checks and the other material on this thread
const Checks = ({ topic, f }) => {
  const th = THREADS[topic]
  const x = THREAD_EXTRAS[topic] || {}
  if (!th)
    return (
      <p className={styles.fine}>
        {f.L(["Rien sur ce sujet.", "Nothing on this topic."])}
      </p>
    )
  const fc = th.factcheck
  const others = (th.also || []).filter(o => o.claim !== fc?.claim)
  const line = (o, en) => (
    <li key={o.url}>
      <span lang="fr" className={styles.alsoClaim}>
        « {o.claim} »
      </span>
      {f.lang !== "fr" && en ? (
        <span className={styles.trailTr}>{en}</span>
      ) : null}
      <span className={styles.alsoMeta}>
        {o.claimant} · {day(f, o.date)} ·{" "}
        <Verdict rating={o.rating} publisher={o.publisher} url={o.url} f={f} />
      </span>
    </li>
  )
  const st = th.statement
  return (
    <div className={styles.alsoChecked}>
      <ul>
        {fc ? line(fc, x.factcheck?.en) : null}
        {others.map(o => line(o, x.also?.[o.url]?.en))}
        {th.social ? line(th.social, x.social?.en) : null}
      </ul>
      {st ? (
        <p className={styles.mediaLine}>
          {f.L(["Dans les médias : ", "In the media: "])}
          {st.speaker} ·{" "}
          {[f.lang === "fr" ? st.type : TYPE_EN[st.type] || st.type, st.media]
            .filter(Boolean)
            .join(", ")}{" "}
          · {day(f, st.date)}{" "}
          <span lang="fr" className={styles.trailTitle}>
            {st.subject}
          </span>{" "}
          <Ext href={st.url}>vie-publique.fr</Ext>
        </p>
      ) : null}
    </div>
  )
}

const Section = ({ id, label, open, onToggle, children }) => (
  <details
    id={`behind-${id}`}
    className={styles.behindPart}
    open={open}
    onToggle={e => onToggle(id, e.currentTarget.open)}
  >
    <summary>{label}</summary>
    {open ? <div className={styles.behindBody}>{children}</div> : null}
  </details>
)

export default function StoryArchive({ topic, onTopic, jump, f }) {
  const [open, setOpen] = React.useState({})
  const toggle = (id, on) =>
    setOpen(o => (!!o[id] === on ? o : { ...o, [id]: on }))
  // a link from the story opens its part and brings it into view
  React.useEffect(() => {
    if (!jump) return
    setOpen(o => ({ ...o, [jump.key]: true }))
    requestAnimationFrame(() =>
      document
        .getElementById(`behind-${jump.key}`)
        ?.scrollIntoView({ block: "start" }),
    )
  }, [jump])
  const read = THREADS[topic]?.test && readTest(topic)
  const parts = [
    [
      "answers",
      ["Les réponses aux enquêtes, en entier", "Every survey answer"],
      <SurveyAnswers key="a" topic={topic} f={f} />,
    ],
    [
      "topics",
      ["Comment les sujets ont été choisis", "How the topics were chosen"],
      <p key="t" className={styles.fine}>
        {say(f, NOTES.rule)} {say(f, NOTES.exception)}{" "}
        {say(f, NOTES.unmeasured)}{" "}
        <a href="#method" className={styles.inlineLink}>
          {say(f, NOTES.method)} →
        </a>
      </p>,
    ],
    [
      "angles",
      [
        "Les débats et le fil des sources",
        "The debates and the evidence trail",
      ],
      <AngleExplorer key="d" topic={topic} f={f} />,
    ],
    [
      "checks",
      ["Vérifications et publications", "Fact-checks and posts"],
      <Checks key="c" topic={topic} f={f} />,
    ],
    [
      "corpus",
      [
        "Tous les textes : par date, par qui parle, par verdict",
        "Every text: by date, by speaker, by verdict",
      ],
      <Corpus key="k" topic={topic} f={f} />,
    ],
    ...(read
      ? [
          [
            "test",
            ["L'affirmation éprouvée", "The claim, tested"],
            <Evidence
              key="e"
              topic={topic}
              parts={TEST_PARTS[topic]}
              read={read}
              f={f}
            />,
          ],
        ]
      : []),
  ]
  return (
    <section
      className={styles.beat}
      data-set="behind"
      aria-labelledby="behind-title"
    >
      <div className={styles.behind}>
        <h3 id="behind-title" className={styles.behindTitle}>
          {f.L(["Derrière l'histoire", "Behind the story"])}
        </h3>
        <div className={styles.behindTopic}>
          <TopicIndex mode="index" topic={topic} onPick={onTopic} f={f} />
        </div>
        {parts.map(([id, label, body]) => (
          <Section
            key={id}
            id={id}
            label={f.L(label)}
            open={!!open[id]}
            onToggle={toggle}
          >
            {body}
          </Section>
        ))}
      </div>
    </section>
  )
}
