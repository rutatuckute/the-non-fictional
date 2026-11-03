import * as React from "react"

import { CompareBars, EuBars, LineChart } from "./charts"
import ORIGINS from "./data/origins.json"
import STATE from "./data/state.json"
import TEXTS from "./data/texts.json"
import { COUNTRIES } from "./questions"
import { loadTexts } from "./story-corpus"
import {
  ACTS,
  BEATS,
  ENDING,
  TEST_PARTS,
  TEST_REVEALS,
  THREAD_EXTRAS,
  say,
} from "./story-copy"
import { Chamber, Checked, Travels } from "./story-examine"
import { ANGLES, THREADS, threadAngle } from "./story-follow"
import { Interview, TopicIndex } from "./story-listen"
import { transition } from "./story-motion"
import { Disclosure } from "./story-parts"
import StoryStage from "./story-stage"
import { ClaimTest, readTest, testResult } from "./story-test"
import { TOPICS } from "./topics"
import styles from "./narrative.module.css"

// "Connect the dots": one edited investigation, in three chapters.
//   What matters       people, a question, the answers, one concern
//   What is said       its debates, one argument in Parliament, checked,
//                      and out on social media
//   What the data says one claim, what can be measured, what the figures show
// The story runs on its own default (cost of living → fuel taxes compared
// with the neighbours); another topic is an option, never a step. What the
// story leaves out (every survey percentage, the evidence trail, the corpus
// and its lenses, the other fact-checks) is in Method and sources. Beats are grouped in sets that share one scene: within a set the
// scene changes in place; between sets, what both sides share travels
// (story-motion.js). The copy lives in story-copy.js.

const WAYS = {
  story: {
    title: ["Relier les points", "Connect the dots"],
  },
  explore: {
    title: ["Creuser les données", "Dig into the data"],
  },
}

const WORDS = {
  en: [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ],
  fr: [
    "zéro",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
  ],
}
const word = (f, n, cap) => {
  const w = WORDS[f.lang === "fr" ? "fr" : "en"][n] ?? f.num(n)
  return cap ? w.charAt(0).toUpperCase() + w.slice(1) : w
}
const lower = s => s.charAt(0).toLowerCase() + s.slice(1)

// A topic's questions: the one that answers the thread's claim first, then
// in the order of how debated their subject is
const topicQuestions = (topic, questions) => {
  const order = THREADS[topic]?.question ? [THREADS[topic].question] : []
  for (const s of ORIGINS.method.topics[topic]?.subjects || [])
    for (const id of s.questions) if (!order.includes(id)) order.push(id)
  return order
    .map(id => questions.find(q => q.id === id))
    .filter(q => q && !q.prep && !q.pending)
}

// The beats, rebuilt for the topic followed. `memory` is the quiet line along
// the top: what the investigation has narrowed down to so far.
const buildBeats = (topic, questions, f) => {
  const th = THREADS[topic]
  const x = THREAD_EXTRAS[topic] || {}
  const qs = topicQuestions(topic, questions)
  const q1 = qs[0]
  const name = f.L(TOPICS[topic].name)
  const out = []
  const add = (id, set, props = {}, vars = {}) =>
    out.push({ id, set, ...props, caption: say(f, BEATS[id].text, vars) })

  add("opening", "interview", { mode: 0, layout: "wide" })
  add("question", "interview", { mode: 1, layout: "wide" })
  add("answers", "interview", { mode: 2, layout: "wide" })
  // the same composition goes on: what changes is under "Cost of living"
  add(
    "concerns",
    "interview",
    { mode: 3, layout: "wide", quiet: true },
    { followed: x.followed ? say(f, x.followed) : lower(name) },
  )

  const angles = ANGLES[topic] || []
  const followed = threadAngle(topic)
  if (angles.length)
    add(
      "debates",
      "interview",
      { mode: 4, layout: "wide", quiet: true },
      { k: word(f, angles.length, true) },
    )
  const memory = `${name} · ${x.short ? say(f, x.short) : followed ? f.L(followed.name) : ""}`
  if (th) {
    const argument = x.argument
      ? say(f, x.argument)
      : followed
        ? lower(f.L(followed.name))
        : lower(name)
    const scene = { layout: "full", quiet: true, memory }
    add(
      "asked",
      "chamber",
      { ...scene, mode: 0, vt: true },
      { argument, why: x.why ? say(f, x.why) : null },
    )
    add(
      "answered",
      "chamber",
      { ...scene, mode: 1, vt: true },
      { minister: th.qag.minister },
    )
    if (th.factcheck) {
      const weeks = th.test
        ? Math.round(
            (new Date(th.factcheck.date) - new Date(th.qag.date)) / 864e5 / 7,
          )
        : 0
      add("checked", "checked", scene, {
        weeks:
          weeks >= 1
            ? `${word(f, weeks, true)} ${f.L(weeks > 1 ? ["semaines", "weeks"] : ["semaine", "week"])}`
            : null,
      })
    }
    if (th.social) add("travels", "travels", scene)
  }

  const read = th?.test && readTest(topic)
  if (read) {
    const parts = TEST_PARTS[topic]
    const groups = TEST_REVEALS[topic]
    const full = { layout: "full" }
    add("claim", "test", {
      ...full,
      mode: "parts",
      reveal: 0,
      memory: say(f, x.claimRef),
    })
    // the line along the top collects what each reveal fixes
    groups.forEach((_, k) =>
      add("parts", "test", {
        ...full,
        mode: "parts",
        reveal: k + 1,
        memory: groups
          .slice(0, k + 1)
          .flat()
          .map(i => say(f, parts[i].short))
          .join(" · "),
      }),
    )
    add("evidence", "test", {
      ...full,
      mode: "evidence",
      vt: true,
      memory: groups
        .flat()
        .map(i => say(f, parts[i].short))
        .join(" · "),
    })
  } else if (q1) {
    add("figure", "figure", { memory })
    if (q1.chart || q1.compare || q1.bars) add("chart", "chart", { memory })
  }
  add("ending", "ending", { layout: "full" })
  return {
    beats: out.map(b => ({
      ...b,
      act: BEATS[b.id].act + 1,
      title: say(f, BEATS[b.id].title),
    })),
    qs,
    tested: !!read,
  }
}

/* ---------- the questions' own data (topics without a tested claim) ---------- */

const Headline = ({ q, f }) => {
  const h = q.headline(f)
  return (
    <div className={styles.hero}>
      <span className={styles.heroQ}>{f.L(q.q)}</span>
      <span className={styles.heroN}>{q.value(f)}</span>
      <span className={styles.heroL}>{f.L(h.label)}</span>
      <span className={styles.fine}>{q.source.producer}</span>
    </div>
  )
}

const QuestionChart = ({ q, f, onTip, onTipEnd }) => {
  const limits = q.cant?.length ? (
    <Disclosure
      label={f.L([
        "Ce que ces données ne disent pas",
        "What this data can't tell you",
      ])}
    >
      {q.cant.map(line => (
        <p key={line[1]}>{f.L(line)}</p>
      ))}
    </Disclosure>
  ) : null
  if (q.chart) {
    const { caption, ...chart } = q.chart(f)
    return (
      <div className={styles.qChart}>
        {caption ? <span className={styles.fine}>{f.L(caption)}</span> : null}
        <LineChart {...chart} height={320} onTip={onTip} onTipEnd={onTipEnd} />
        {limits}
      </div>
    )
  }
  if (q.compare) {
    const { caption, ...compare } = q.compare(f)
    return (
      <div className={styles.qChart}>
        <span className={styles.fine}>{f.L(caption)}</span>
        <CompareBars {...compare} onTip={onTip} onTipEnd={onTipEnd} />
        {limits}
      </div>
    )
  }
  if (q.bars)
    return (
      <div className={styles.qChart}>
        <EuBars
          data={STATE.fuelEu}
          countries={COUNTRIES}
          f={f}
          onTip={onTip}
          onTipEnd={onTipEnd}
        />
        {limits}
      </div>
    )
  return null
}

/* ---------- the ending ---------- */

// The result and where it stops, then one question to go on with. The rest stays
// available, and quiet.
const Ending = ({ topic, qs, tested, onExplore, onPick, f }) => {
  const h = !tested && qs[0]?.headline(f)
  const { result, limit } = tested
    ? testResult(topic, f)
    : {
        result: qs[0] ? `${qs[0].value(f)} ${f.L(h.label)}` : "",
        limit: qs[0]?.cant?.length ? f.L(qs[0].cant[0]) : "",
      }
  const next = tested ? qs[0] : qs[1] || qs[0]
  const others = qs.filter(q => q !== next)
  return (
    <div className={styles.ending}>
      <div className={styles.endingResult}>
        <p className={styles.endingLine}>{result}</p>
        <p className={styles.endingLimit}>{limit}</p>
      </div>
      <div className={styles.endingMore}>
        {next ? (
          <div className={styles.endingNext}>
            <span className={styles.kicker}>{say(f, ENDING.next)}</span>
            <button type="button" onClick={() => onExplore(topic, next.id)}>
              {f.L(next.q)} <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}
        {others.length ? (
          <div className={styles.endingQuiet}>
            <span className={styles.kicker}>{say(f, ENDING.more)}</span>
            <ol>
              {others.map(q => (
                <li key={q.id}>
                  <button type="button" onClick={() => onExplore(topic, q.id)}>
                    {f.L(q.q)}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        <div className={styles.endingQuiet}>
          <span className={styles.kicker}>{say(f, ENDING.other)}</span>
          <TopicIndex mode="index" topic={topic} onPick={onPick} f={f} />
        </div>
      </div>
    </div>
  )
}

/* ---------- the story ---------- */

export default function Story({
  f,
  questions,
  onExplore,
  onTip,
  onTipEnd,
  mode: boxMode,
  onMode,
  explorer,
  exploreTopic,
  onBegun,
  openMethod,
  frameRef,
}) {
  const [topic, setTopic] = React.useState("cost")
  const [at, setAt] = React.useState(0)
  const { beats, qs, tested } = buildBeats(topic, questions, f)
  const i = Math.min(at, beats.length - 1)
  const beat = beats[i]
  const fieldAt = beats.findIndex(b => b.id === "concerns")
  React.useLayoutEffect(() => {
    onBegun?.(i > 0)
  }, [i > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // the explorer's topic and the story's stay the same
  React.useEffect(() => {
    if (
      exploreTopic &&
      TOPICS[exploreTopic]?.measurable !== false &&
      THREADS[exploreTopic]
    )
      setTopic(exploreTopic)
  }, [exploreTopic])

  // another topic: the story rewrites itself; in the field it stays where it
  // is, from the ending it goes back to the field
  const pick = key => {
    if (key === topic) return
    if (beat.id === "concerns") setTopic(key)
    else
      transition(() => {
        setTopic(key)
        setAt(fieldAt)
      })
  }
  // the supporting detail, in Method and sources, on this topic; the section
  // offers the way back, and the story keeps its place
  const toMethod = (stage, part) =>
    openMethod({
      stage,
      part,
      topic,
      from: ["Revenir à l'histoire", "Back to the story"],
    })
  // Method and sources follows the concern being followed
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("datalab:topic", { detail: topic }))
  }, [topic])
  // the texts Method and sources may need, fetched while the reader is reading
  React.useEffect(() => {
    if (beat.act >= 2) loadTexts(topic).catch(() => {})
  }, [beat.act, topic])
  const n = TEXTS.topics[topic]

  const scene = () => {
    switch (beat.set) {
      case "interview":
        return (
          <Interview
            mode={beat.mode}
            topic={topic}
            narration={beat.caption}
            onPick={pick}
            f={f}
            total={n.p + n.g + n.f}
            onAnswers={() => toMethod("concerns", "answers")}
            onTopics={() => toMethod("topics", "detail")}
            onTexts={() => toMethod("debate", "corpus")}
          />
        )
      case "chamber":
        return (
          <Chamber
            topic={topic}
            mode={beat.mode}
            line={beat.caption}
            f={f}
            onMore={() => toMethod("questions", "trail")}
          />
        )
      case "checked":
        return (
          <Checked
            topic={topic}
            line={beat.caption}
            f={f}
            onMore={() => toMethod("debate", "checks")}
          />
        )
      case "travels":
        return <Travels topic={topic} line={beat.caption} f={f} />
      case "test":
        return (
          <ClaimTest
            topic={topic}
            mode={beat.mode}
            reveal={beat.reveal}
            f={f}
            onMore={() => toMethod("data", "test")}
          />
        )
      case "figure":
        return <Headline q={qs[0]} f={f} />
      case "chart":
        return (
          <QuestionChart q={qs[0]} f={f} onTip={onTip} onTipEnd={onTipEnd} />
        )
      case "ending":
        return (
          <Ending
            topic={topic}
            qs={qs}
            tested={tested}
            onExplore={onExplore}
            onPick={pick}
            f={f}
          />
        )
      default:
        return null
    }
  }

  return (
    <StoryStage
      f={f}
      label={[
        "Relier les points : de la préoccupation aux chiffres",
        "Connect the dots: from concern to figures",
      ]}
      acts={ACTS.map(a => [a.fr, a.en])}
      steps={beats}
      at={i}
      onGo={setAt}
      ways={WAYS}
      onExplore={() => onExplore(topic, qs[0]?.id)}
      sceneKey={`${beat.set}-${beat.set === "interview" ? "" : topic}`}
      mode={boxMode}
      onMode={onMode}
      explorer={explorer}
      frameRef={frameRef}
    >
      <div className={styles.beat} data-beat={beat.id} data-set={beat.set}>
        {scene()}
      </div>
    </StoryStage>
  )
}
