import * as React from "react"

import { BAROMETERS as SURVEYS, ORDER } from "./barometers"
import BAROMETERS from "./data/topics.json"
import THREADS from "./data/threads.json"
import { Corpus } from "./story-corpus"
import { NOTES, TEST_PARTS, THREAD_EXTRAS, dots, say } from "./story-copy"
import { AngleExplorer } from "./story-follow"
import { Ext, TYPE_EN, Verdict, day } from "./story-parts"
import { Evidence, EvidenceDetail, readTest } from "./story-test"
import narrative from "./narrative.module.css"

// What each method stage holds beyond its summary, for the concern selected.
// Everything the guided story leaves out is here, once: the story and the
// explorer link to it, and it opens on demand (the heavier parts only load then).

// Every survey's answers, with their shares. How each survey asks is in the
// stage's summary, just above.
const SurveyAnswers = ({ topic, f }) => (
  <>
    <p className={narrative.fine}>{say(f, NOTES.answersEB)}</p>
    <div className={narrative.surveys}>
      {ORDER.map(key => {
        const s = SURVEYS[key]
        const items = BAROMETERS.items
          .filter(i => i.barometer === key)
          .sort((a, b) => a.rank - b.rank)
        const max = Math.max(...items.map(i => i.share))
        return (
          <div key={key} className={narrative.survey}>
            <h5>
              {key === "eurobarometer" && f.lang !== "fr"
                ? "Standard Eurobarometer"
                : s.name}
            </h5>
            <ol>
              {items.map(i => (
                <li key={i.item} data-on={i.topic === topic ? "" : undefined}>
                  <span lang={key === "eurobarometer" ? "en" : "fr"}>
                    {dots(i.item)}
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
            {s.note ? <p className={narrative.fine}>{f.L(s.note)}</p> : null}
          </div>
        )
      })}
    </div>
  </>
)

// The fact-checks and posts on the thread followed, and its statement in the media
const Checks = ({ topic, f }) => {
  const th = THREADS[topic]
  const x = THREAD_EXTRAS[topic] || {}
  if (!th)
    return (
      <p className={narrative.fine}>
        {f.L(["Rien sur ce sujet.", "Nothing on this topic."])}
      </p>
    )
  const fc = th.factcheck
  const others = (th.also || []).filter(o => o.claim !== fc?.claim)
  const line = (o, en) => (
    <li key={o.url}>
      <span lang="fr" className={narrative.alsoClaim}>
        « {o.claim} »
      </span>
      {f.lang !== "fr" && en ? (
        <span className={narrative.trailTr}>{en}</span>
      ) : null}
      <span className={narrative.alsoMeta}>
        {o.claimant} · {day(f, o.date)} ·{" "}
        <Verdict rating={o.rating} publisher={o.publisher} url={o.url} f={f} />
      </span>
    </li>
  )
  const st = th.statement
  return (
    <div className={narrative.alsoChecked}>
      <ul>
        {fc ? line(fc, x.factcheck?.en) : null}
        {others.map(o => line(o, x.also?.[o.url]?.en))}
        {th.social ? line(th.social, x.social?.en) : null}
      </ul>
      {st ? (
        <p className={narrative.mediaLine}>
          {f.L(["Dans les médias : ", "In the media: "])}
          {st.speaker} ·{" "}
          {[f.lang === "fr" ? st.type : TYPE_EN[st.type] || st.type, st.media]
            .filter(Boolean)
            .join(", ")}{" "}
          · {day(f, st.date)}{" "}
          <span lang="fr" className={narrative.trailTitle}>
            {st.subject}
          </span>{" "}
          <Ext href={st.url}>vie-publique.fr</Ext>
        </p>
      ) : null}
    </div>
  )
}

// The claim tested on this concern: the chart in both states, and the reasoning
const TestedClaim = ({ topic, f }) => {
  const read = THREADS[topic]?.test && readTest(topic)
  if (!read)
    return (
      <p className={narrative.fine}>
        {f.L([
          "Aucune affirmation éprouvée sur ce sujet pour l'instant.",
          "No claim has been tested on this concern yet.",
        ])}
      </p>
    )
  return (
    <>
      <Evidence topic={topic} parts={TEST_PARTS[topic]} read={read} f={f} />
      <EvidenceDetail topic={topic} read={read} f={f} />
    </>
  )
}

const Narrative = ({ children }) => (
  <div className={narrative.beat} data-set="method">
    {children}
  </div>
)

// [part id, label, what it shows, does it change with the selected concern?]
export const stageParts = (stage, topic, f) =>
  ({
    concerns: [
      [
        "answers",
        ["Toutes les réponses aux enquêtes", "Every survey answer"],
        <Narrative key="a">
          <SurveyAnswers topic={topic} f={f} />
        </Narrative>,
        false,
      ],
    ],
    topics: [],
    debate: [
      [
        "corpus",
        [
          "Tous les textes : par date, par qui parle, par verdict",
          "Every text: by date, by speaker, by verdict",
        ],
        <Narrative key="c">
          <Corpus topic={topic} f={f} />
        </Narrative>,
        true,
      ],
      [
        "checks",
        ["Vérifications et publications", "Fact-checks and posts"],
        <Narrative key="k">
          <Checks topic={topic} f={f} />
        </Narrative>,
        true,
      ],
    ],
    questions: [
      [
        "trail",
        [
          "Les débats et le fil des sources",
          "The debates and the evidence trail",
        ],
        <Narrative key="t">
          <AngleExplorer topic={topic} f={f} />
        </Narrative>,
        true,
      ],
    ],
    data: [
      [
        "test",
        ["L'affirmation éprouvée", "The claim, tested"],
        <Narrative key="e">
          <TestedClaim topic={topic} f={f} />
        </Narrative>,
        true,
      ],
    ],
  })[stage] || []
