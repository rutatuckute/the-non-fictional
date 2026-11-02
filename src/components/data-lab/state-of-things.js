import * as React from "react"

import { CompareBars, EuBars, LineChart, Spark, useTip } from "./charts"
import FranceMap from "./france-map"
import { COUNTRIES, buildQuestions } from "./questions"
import Story from "./story"
import { DECISION, KEPT, TOPICS } from "./topics"
import ORIGINS from "./data/origins.json"
import STATE from "./data/state.json"
import styles from "./state.module.css"

// 01 · The state of things. Topics across the top, the questions down the
// left, the chosen question on the right. A question is linkable (?q=fuel)
// and keeps the reader's language.
const QUESTIONS = buildQuestions(STATE)
const DEFAULT = "fuel"

// Every kept topic appears, in the order of the decision. A topic without
// questions yet stands as one entry of its own (id "topic-<key>").
const ENTRIES = KEPT.flatMap(topic => {
  const questions = QUESTIONS.filter(q => q.topic === topic)
  return questions.length
    ? questions
    : [{ id: `topic-${topic}`, topic, pending: true }]
})

// How a figure reached the page: read from an official dataset, or copied by
// hand from a report or chart because no dataset exists (always with the
// document it comes from, listed in the source card).
const SOURCE_TYPES = {
  official: ["Chiffre officiel", "Official figure"],
  transcribed: ["Relevé à la main", "Transcribed by hand"],
}
const Chip = ({ type, f }) => (
  <span className={styles.chip}>{f.L(SOURCE_TYPES[type])}</span>
)

const day = (f, iso) =>
  f.date(iso, { day: "numeric", month: "short", year: "numeric" })

// Where a question comes from: what the three source families said on its
// subject between October 2025 and October 2026 (see the method section),
// counted, with a few examples each. Fact-checkers' verdicts are left out:
// the page shows data, not rulings.
const Origins = ({ question, f, open }) => {
  const o = ORIGINS.questions[question.id]
  if (!o) return null
  const c = o.counts
  return (
    <details className={styles.origin} open={open}>
      <summary>
        <span className={styles.label}>
          {f.L(["D'où vient cette question", "Where this question comes from"])}
        </span>
        <span className={styles.meta}>{f.L(o.subject)}</span>
      </summary>
      <p className={styles.originCounts}>
        {f.L([
          `Assemblée nationale : ${c.parliament} question${c.parliament > 1 ? "s" : ""} au gouvernement, de ${c.groups} groupe${c.groups > 1 ? "s" : ""}`,
          `Assemblée nationale: ${c.parliament} question${c.parliament > 1 ? "s" : ""} to the government, from ${c.groups} group${c.groups > 1 ? "s" : ""}`,
        ])}
        {" · "}
        {f.L([
          `Gouvernement : ${c.government} déclaration${c.government > 1 ? "s" : ""}`,
          `Government: ${c.government} statement${c.government > 1 ? "s" : ""}`,
        ])}
        {" · "}
        {f.L([
          `Vérifications : ${c.factchecks}`,
          `Fact-checks: ${c.factchecks}`,
        ])}
      </p>
      <ul className={styles.originList}>
        {o.parliament.map(x => (
          <li key={x.url}>
            <span className={styles.meta}>
              {f.L(["Assemblée", "Assemblée"])} · {day(f, x.date)} · {x.group}
              {x.who ? ` · ${x.who}` : ""}
            </span>
            <span className={styles.originText}>« {x.label} »</span>
            <a
              className={styles.originLink}
              href={x.url}
              target="_blank"
              rel="noopener"
            >
              assemblee-nationale.fr
            </a>
          </li>
        ))}
        {o.government.map(x => (
          <li key={x.url}>
            <span className={styles.meta}>
              {f.L(["Gouvernement", "Government"])} · {day(f, x.date)}
              {x.who ? ` · ${x.who}` : ""}
            </span>
            <span className={styles.originText}>{x.title}</span>
            <a
              className={styles.originLink}
              href={x.url}
              target="_blank"
              rel="noopener"
            >
              vie-publique.fr
            </a>
          </li>
        ))}
        {o.factchecks.map(x => (
          <li key={x.url}>
            <span className={styles.meta}>
              {f.L(["Vérifié par", "Checked by"])} {x.publisher} ·{" "}
              {day(f, x.date)}
              {x.who ? ` · ${x.who}` : ""}
            </span>
            <span className={styles.originText}>« {x.claim} »</span>
            <a
              className={styles.originLink}
              href={x.url}
              target="_blank"
              rel="noopener"
            >
              {new URL(x.url).hostname.replace(/^www\./, "")}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}

// What people think, where one of the barometers asked: shown beside the
// data, never as the answer.
const Perception = ({ question, f }) => {
  const p = ORIGINS.questions[question.id]?.perception
  if (!p) return null
  return (
    <p className={styles.perception}>
      <span className={styles.label}>
        {f.L(["Ce que pensent les Français", "What people in France think"])}
      </span>
      <span className={styles.perceptionText}>{f.L(p.text)}</span>
      <span className={styles.meta}>
        {f.L(p.source)}, p. {p.page}
      </span>
    </p>
  )
}

const Prepared = ({ question, f }) => (
  <>
    <Origins question={question} f={f} open />
    <Perception question={question} f={f} />
    <div className={styles.prep}>
      <span className={styles.chip}>
        {f.L(["En préparation", "In preparation"])}
      </span>
      <span className={styles.label}>
        {f.L(["Ce que nous publierons", "What we will publish"])}
      </span>
      <p className={styles.prepText}>{f.L(question.prep.what)}</p>
      <dl className={styles.prepRows}>
        <dt>{f.L(["Source", "Source"])}</dt>
        <dd>{question.prep.source}</dd>
        <dt>{f.L(["Fréquence", "Cadence"])}</dt>
        <dd>{f.L(question.prep.cadence)}</dd>
      </dl>
      <span className={styles.label}>
        {f.L([
          "Ce que ces données ne disent pas",
          "What this data can't tell you",
        ])}
      </span>
      <p className={styles.meta}>{f.L(question.prep.caveat)}</p>
    </div>
  </>
)

const Pending = ({ entry, f }) => {
  const d = DECISION[entry.topic]
  const unmeasurable = TOPICS[entry.topic].measurable === false
  return (
    <div className={styles.prep}>
      <span className={styles.chip}>
        {unmeasurable
          ? f.L(["Non mesurable ici", "Not measurable here"])
          : f.L(["Questions à venir", "Questions to come"])}
      </span>
      <p className={styles.prepText}>
        {unmeasurable
          ? f.L([
              "Ce sujet figure dans le top 10 de deux baromètres, mais aucune donnée sur l'état de la France ne permet d'y répondre ici.",
              "This topic is in the top 10 of two barometers, but no data on the state of France can answer it here.",
            ])
          : f.L([
              "Les questions de ce sujet seront tirées d'affirmations publiques, selon la méthode décrite plus bas.",
              "This topic's questions will be drawn from public claims, following the method described below.",
            ])}
      </p>
      <p className={styles.meta}>
        {f.L([
          `Retenu : top 10 de ${d.count} baromètres sur 3.`,
          `Kept: top 10 of ${d.count} barometers out of 3.`,
        ])}{" "}
        <a className={styles.originLink} href="#method">
          {f.L(["Voir la méthode", "See the method"])}
        </a>
      </p>
    </div>
  )
}

const Answered = ({ question, f, onTip, onTipEnd }) => {
  const headline = question.headline(f)
  const source = question.source
  return (
    <>
      <Origins question={question} f={f} />
      <div className={styles.figure}>
        <span className={styles.big}>{question.value(f)}</span>
        <span className={styles.figureText}>
          <span className={styles.figureLabel}>{f.L(headline.label)}</span>
          <span className={styles.meta}>{f.L(headline.vs)}</span>
        </span>
        <Chip type={source.type} f={f} />
      </div>
      <Perception question={question} f={f} />

      {question.chart
        ? (({ caption, ...chart }) => (
            <div className={styles.compare}>
              {caption ? (
                <span className={styles.meta}>{f.L(caption)}</span>
              ) : null}
              <LineChart {...chart} onTip={onTip} onTipEnd={onTipEnd} />
            </div>
          ))(question.chart(f))
        : null}
      {question.bars ? (
        <EuBars
          data={STATE.fuelEu}
          countries={COUNTRIES}
          f={f}
          onTip={onTip}
          onTipEnd={onTipEnd}
        />
      ) : null}

      {question.compare
        ? (({ caption, ...compare }) => (
            <div className={styles.compare}>
              <span className={styles.meta}>{f.L(caption)}</span>
              <CompareBars {...compare} onTip={onTip} onTipEnd={onTipEnd} />
            </div>
          ))(question.compare(f))
        : null}

      {question.tiles ? (
        <div className={styles.tiles}>
          {question.tiles.map(tile => (
            <div className={styles.tile} key={tile.label[1]}>
              <span className={styles.meta}>{f.L(tile.label)}</span>
              <span className={styles.tileValue}>
                {tile.fmt ? tile.fmt(f)(tile.value) : f.pct(tile.value)}
              </span>
              {tile.series ? (
                <Spark values={tile.series} width={90} height={22} />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {question.quotes
        ? (({ caption, items }) => (
            <div className={styles.compare}>
              <span className={styles.label}>{f.L(caption)}</span>
              <ul className={styles.originList}>
                {items.map(item => (
                  <li key={item.text[1]}>
                    <span className={styles.originText}>
                      « {f.L(item.text)} »
                    </span>
                    <a
                      className={styles.originLink}
                      href={item.url}
                      target="_blank"
                      rel="noopener"
                    >
                      {f.L(item.source)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))(question.quotes(f))
        : null}

      {question.map ? (
        <div className={styles.byDep}>
          <span className={styles.label}>
            {f.L(["Par département", "By département"])}
          </span>
          <span className={styles.meta}>{f.L(question.map.caption(f))}</span>
          <FranceMap
            values={question.map.values}
            fmt={question.map.fmt(f)}
            label={f.L(question.map.caption(f))}
            noData={f.L(["pas de donnée", "no data"])}
            onTip={onTip}
            onTipEnd={onTipEnd}
          />
        </div>
      ) : (
        <p className={`${styles.meta} ${styles.noMap}`}>
          {f.L([
            "Pas de données par département pour cette série.",
            "No département breakdown for this series.",
          ])}
        </p>
      )}

      <div className={styles.foot}>
        <div className={styles.cant}>
          <span className={styles.label}>
            {f.L([
              "Ce que ces données ne disent pas",
              "What this data can't tell you",
            ])}
          </span>
          <ul>
            {question.cant.map(line => (
              <li key={line[1]}>{f.L(line)}</li>
            ))}
          </ul>
        </div>
        <dl className={styles.sourceCard}>
          <dt>{f.L(["Source", "Source"])}</dt>
          <dd>
            {source.producer} <Chip type={source.type} f={f} />
          </dd>
          <dt>{f.L(["Fréquence", "Cadence"])}</dt>
          <dd>{f.L(source.cadence)}</dd>
          <dt>{f.L(["Dernière donnée", "Latest data"])}</dt>
          <dd>{source.latest(f)}</dd>
          <dt>{f.L(["Prochaine publication", "Next release"])}</dt>
          <dd>{f.L(source.next)}</dd>
          {source.note ? (
            <>
              <dt>{f.L(["À noter", "Note"])}</dt>
              <dd>{f.L(source.note)}</dd>
            </>
          ) : null}
          {source.documents ? (
            <>
              <dt>{f.L(["Documents", "Documents"])}</dt>
              <dd>
                <ul className={styles.documents}>
                  {source.documents.map(([label, url]) => (
                    <li key={url}>
                      <a
                        className={styles.originLink}
                        href={url}
                        target="_blank"
                        rel="noopener"
                      >
                        {f.L(label)}
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          ) : null}
        </dl>
      </div>
    </>
  )
}

export default function StateOfThings({ f }) {
  const [topic, setTopic] = React.useState("all")
  const [id, setId] = React.useState(DEFAULT)
  // the box opens on the story; a question link (?q=) opens the explorer
  const [mode, setMode] = React.useState("story")
  const frame = React.useRef(null)
  const toFrame = () => frame.current?.scrollIntoView({ block: "start" })
  const [tip, showTip, hideTip] = useTip()

  React.useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("q")
    if (ENTRIES.some(q => q.id === requested)) {
      setId(requested)
      setMode("explore")
    }
  }, [])

  // The method section can open a question here.
  React.useEffect(() => {
    const open = event => {
      if (!ENTRIES.some(q => q.id === event.detail)) return
      setTopic("all")
      choose(event.detail)
      setMode("explore")
      requestAnimationFrame(toFrame)
    }
    window.addEventListener("datalab:question", open)
    return () => window.removeEventListener("datalab:question", open)
  }, [])

  const choose = next => {
    setId(next)
    const url = new URL(window.location.href)
    url.searchParams.set("q", next)
    window.history.replaceState(null, "", url)
  }

  const chooseTopic = next => {
    setTopic(next)
    const current = ENTRIES.find(q => q.id === id)
    if (next !== "all" && current.topic !== next)
      choose(ENTRIES.find(q => q.topic === next).id)
  }

  // The story hands over to the explorer, in the same box, open on the topic
  // and question the reader followed.
  const explore = (next, questionId) => {
    setTopic(next)
    if (questionId) choose(questionId)
    setMode("explore")
    requestAnimationFrame(toFrame)
  }

  const list = ENTRIES.filter(q => topic === "all" || q.topic === topic)
  const question = ENTRIES.find(q => q.id === id)

  return (
    <section
      className={styles.section}
      id="state"
      aria-labelledby="state-title"
    >
      <header className={styles.head}>
        <span className={styles.numeral}>01</span>
        <div>
          <h2 className={styles.title} id="state-title">
            {f.L(["L'état des choses", "The state of things"])}
          </h2>
          <p className={styles.sub}>
            {f.L([
              "Ce qui préoccupe les Français, les questions du débat public, et les données officielles qui aident à y répondre.",
              "What concerns people in France, the questions of public debate, and the official data that helps answer them.",
            ])}
          </p>
        </div>
      </header>

      <Story
        f={f}
        questions={QUESTIONS}
        onExplore={explore}
        onTip={showTip}
        onTipEnd={hideTip}
        mode={mode}
        onMode={setMode}
        frameRef={frame}
        exploreTopic={topic}
        explorer={
          <>
            <div
              className={styles.topics}
              id="state-explore"
              role="group"
              aria-label={f.L(["Sujets", "Topics"])}
            >
              {[
                ["all", ["Tous les sujets", "All topics"]],
                ...KEPT.map(key => [key, TOPICS[key].name]),
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={topic === key}
                  onClick={() => chooseTopic(key)}
                >
                  {f.L(label)}
                </button>
              ))}
            </div>

            <div className={styles.grid}>
              <nav
                className={styles.questions}
                aria-label={f.L(["Questions", "Questions"])}
              >
                {list.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    className={
                      q.prep || q.pending
                        ? `${styles.question} ${styles.isPrep}`
                        : styles.question
                    }
                    aria-pressed={q.id === id}
                    onClick={() => choose(q.id)}
                  >
                    <span className={styles.label}>
                      {f.L(TOPICS[q.topic].name)}
                    </span>
                    <span className={styles.questionText}>
                      {q.pending
                        ? TOPICS[q.topic].measurable === false
                          ? f.L(["Non mesurable ici", "Not measurable here"])
                          : f.L(["Questions à venir", "Questions to come"])
                        : f.L(q.q)}
                    </span>
                    <span className={styles.questionMeta}>
                      {q.pending ? null : q.prep ? (
                        <span className={styles.meta}>
                          {f.L(["En préparation", "In preparation"])}
                        </span>
                      ) : (
                        <span className={styles.questionValue}>
                          {q.value(f)}
                        </span>
                      )}
                      {q.spark ? <Spark values={q.spark} /> : null}
                    </span>
                  </button>
                ))}
              </nav>

              <article className={styles.view} aria-live="polite">
                <header className={styles.viewHead}>
                  <span className={`${styles.label} ${styles.isSlot}`}>
                    {f.L(TOPICS[question.topic].name)}
                  </span>
                  <h3 className={styles.viewTitle}>
                    {question.pending
                      ? f.L(TOPICS[question.topic].name)
                      : f.L(question.q)}
                  </h3>
                </header>
                {question.pending ? (
                  <Pending entry={question} f={f} />
                ) : question.prep ? (
                  <Prepared question={question} f={f} />
                ) : (
                  <Answered
                    question={question}
                    f={f}
                    onTip={showTip}
                    onTipEnd={hideTip}
                  />
                )}
              </article>
            </div>
          </>
        }
      />

      {tip}
    </section>
  )
}
