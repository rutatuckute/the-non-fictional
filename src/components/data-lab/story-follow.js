import * as React from "react"

import ANGLES from "./data/angles.json"
import THREADS from "./data/threads.json"
import { NOTES, THREAD_EXTRAS, fragmentOf, say } from "./story-copy"
import { shared, useCount } from "./story-motion"
import { Quote, TYPE_EN, Verdict, cut, day, groupName } from "./story-parts"
import styles from "./narrative.module.css"

// What is said. The followed concern opens into the angles it is debated
// from: one row per angle, one icon per collected text. The followed angle,
// in terracotta, opens into the chamber. The evidence trail (who said what,
// when, the whole quotation one click away) lives in Method and sources.

export { ANGLES, THREADS }
const angleTotal = a => a.n.p + a.n.g + a.n.f
// the angle the thread follows: the one holding the thread's question
export const threadAngle = topic =>
  (ANGLES[topic] || []).find(a =>
    a.questions.includes(THREADS[topic]?.question),
  )

const PARTS = [
  ["p", ["Questions à l'Assemblée", "Questions in the Assemblée"]],
  ["g", ["Déclarations du gouvernement", "Government statements"]],
  ["f", ["Affirmations vérifiées", "Fact-checked claims"]],
]

// The thread as a trail of dated sources, oldest first. Each line carries
// the fragment that holds the argument (or, for a document known only by
// its title, the title, without quotation marks).
export const trailFor = topic => {
  const th = THREADS[topic]
  if (!th) return []
  const x = THREAD_EXTRAS[topic] || {}
  const q = th.qag
  const items = [
    th.statement && {
      k: "s",
      date: th.statement.date,
      who: th.statement.speaker,
      role: [th.statement.type, th.statement.media].filter(Boolean),
      title: th.statement.subject,
      url: th.statement.url,
      link: ["Le texte sur vie-publique.fr", "The text on vie-publique.fr"],
    },
    {
      k: "q",
      date: q.date,
      who: `${q.deputy} · ${groupName(q.group)}`,
      quote: q.question,
      quoteEn: x.question?.en,
      fragment: fragmentOf(q.question, x.question),
      fragmentEn: x.question?.fragmentEn,
      url: q.url,
      link: [
        "La séance, assemblee-nationale.fr",
        "The session, assemblee-nationale.fr",
      ],
    },
    ...(th.echo || []).map(e => ({
      k: "e",
      date: e.date,
      who: `${e.deputy} · ${groupName(e.group)}`,
      quote: e.quote,
      fragment: fragmentOf(e.quote, x.echo?.[e.id]),
      fragmentEn: x.echo?.[e.id]?.fragmentEn,
      url: e.url,
      link: [
        "La séance, assemblee-nationale.fr",
        "The session, assemblee-nationale.fr",
      ],
    })),
    {
      k: "a",
      date: q.date,
      who: q.minister,
      role: [cut(q.ministerTitle, 60)],
      quote: q.answer,
      quoteEn: x.answer?.en,
      fragment: fragmentOf(q.answer, x.answer),
      fragmentEn: x.answer?.fragmentEn,
      url: q.url,
      link: [
        "La séance, assemblee-nationale.fr",
        "The session, assemblee-nationale.fr",
      ],
    },
    th.factcheck && {
      k: "c",
      date: th.factcheck.date,
      who: th.factcheck.claimant,
      quote: th.factcheck.claim,
      quoteEn: x.factcheck?.en,
      fragment: th.factcheck.claim,
      fragmentEn: x.factcheck?.en,
      url: th.factcheck.url,
      rating: th.factcheck.rating,
      publisher: th.factcheck.publisher,
      link: ["La vérification", "The fact-check"],
    },
  ].filter(Boolean)
  const order = { s: 0, q: 1, e: 2, a: 3, c: 4 }
  return items.sort(
    (a, b) => a.date.localeCompare(b.date) || order[a.k] - order[b.k],
  )
}
// another angle has no thread: its examples, one per kind of source
const examplesFor = angle =>
  ["p", "g", "f"]
    .map(k => {
      const e = angle.examples?.[k]
      if (!e) return null
      return k === "f"
        ? {
            k: "c",
            date: e.date,
            who: e.claimant,
            quote: e.claim,
            fragment: e.claim,
            url: e.url,
            rating: e.rating,
            publisher: e.publisher,
            link: ["La vérification", "The fact-check"],
          }
        : {
            k: k === "p" ? "q" : "s",
            date: e.date,
            who:
              k === "p"
                ? [e.who, groupName(e.group)].filter(Boolean).join(" · ")
                : e.who,
            role: k === "g" ? [e.type, e.media].filter(Boolean) : null,
            title: e.subject,
            url: e.url,
            link:
              k === "p"
                ? [
                    "La séance, assemblee-nationale.fr",
                    "The session, assemblee-nationale.fr",
                  ]
                : [
                    "Le texte sur vie-publique.fr",
                    "The text on vie-publique.fr",
                  ],
          }
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))

const Total = ({ to, delay, f }) => f.num(Math.round(useCount(to, delay)))

// One line of the trail: date, who, the fragment. Opened, the quotation in
// full, its translation, its source.
const TrailItem = ({ x, open, onOpen, f }) => {
  const en = f.lang !== "fr"
  const role = (x.role || []).map(r => (en ? TYPE_EN[r] || r : r)).join(" · ")
  return (
    <li
      className={`${styles.trailItem} ${open ? styles.isOpen : ""}`}
      data-k={x.k}
    >
      <span className={styles.trailDate}>{day(f, x.date)}</span>
      <div className={styles.trailBody}>
        <span className={styles.trailWho}>
          {x.who}
          {role ? <span> · {role}</span> : null}
        </span>
        {open && x.quote ? (
          <Quote
            text={x.quote}
            translation={x.quoteEn}
            size="s"
            f={f}
            cite={{ url: x.url, link: f.L(x.link) }}
          >
            {x.rating ? (
              <Verdict rating={x.rating} publisher={x.publisher} f={f} />
            ) : null}
          </Quote>
        ) : (
          <button
            type="button"
            className={styles.trailLine}
            aria-expanded={open}
            onClick={onOpen}
          >
            {x.title ? (
              <span className={styles.trailTitle} lang="fr">
                {x.title}
              </span>
            ) : (
              <>
                <span lang="fr" className={styles.trailFragment}>
                  «&nbsp;
                  {x.fragment
                    ? `${x.quote.startsWith(x.fragment) ? "" : "… "}${x.fragment}${x.quote.endsWith(x.fragment) ? "" : " …"}`
                    : cut(x.quote, 110)}
                  &nbsp;»
                </span>
                {en && x.fragment && x.fragmentEn ? (
                  <span className={styles.trailTr}>{x.fragmentEn}</span>
                ) : null}
              </>
            )}
          </button>
        )}
        {open && x.title ? (
          <a
            className={styles.ext}
            href={x.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {f.L(x.link)} ↗
          </a>
        ) : null}
        {!open && x.rating ? (
          <Verdict rating={x.rating} publisher={x.publisher} f={f} />
        ) : null}
      </div>
    </li>
  )
}

const Row = ({ a, f, delay }) => (
  <>
    <span className={styles.angleName}>{f.L(a.name)}</span>
    {/* one icon per text: a bubble for a question, a microphone for a
        statement, a magnifying glass for a fact-check */}
    <span
      className={styles.angleIcons}
      role="img"
      aria-label={PARTS.map(([k, l]) => `${f.L(l)} ${f.num(a.n[k])}`).join(
        ", ",
      )}
    >
      {PARTS.flatMap(([k]) =>
        Array.from({ length: a.n[k] }, (_, j) => (
          <i key={`${k}${j}`} data-k={k} />
        )),
      )}
    </span>
    <span className={styles.angleN}>
      {delay == null ? (
        f.num(angleTotal(a))
      ) : (
        <Total to={angleTotal(a)} delay={delay} f={f} />
      )}
    </span>
  </>
)
const Key = ({ f, children }) => (
  <div className={styles.angleKey}>
    <span className={styles.keyItems}>
      {PARTS.map(([k, l]) => (
        <span key={k}>
          <i data-k={k} />
          {f.L(l)}
        </span>
      ))}
    </span>
    <span className={styles.fine}>{children}</span>
  </div>
)

// The guided story: the landscape of debates, the followed angle in
// terracotta, the row that opens into the chamber
export const Debates = ({ topic, f, total, onMore, live }) => {
  const list = ANGLES[topic] || []
  const followed = threadAngle(topic)
  if (!list.length) return null
  return (
    <div className={styles.debates}>
      <ol className={styles.angleList}>
        {list.map((a, i) => (
          <li
            key={a.id}
            className={`${styles.angle} ${a.id === followed?.id ? styles.isThreadAngle : ""}`}
            style={{
              "--i": i,
              ...shared(live && a.id === followed?.id ? "doc-q" : null),
            }}
          >
            <div className={styles.angleRow}>
              <Row a={a} f={f} />
            </div>
          </li>
        ))}
      </ol>
      <Key f={f}>
        {say(f, NOTES.angles)}{" "}
        {onMore ? (
          <button
            type="button"
            className={styles.inlineButton}
            onClick={onMore}
          >
            {f.L([`Les ${f.num(total)} textes`, `All ${f.num(total)} texts`])} →
          </button>
        ) : null}
      </Key>
    </div>
  )
}

// Method and sources: every angle, chosen freely, with its sources; for the
// followed one, the whole evidence trail
export const AngleExplorer = ({ topic, f }) => {
  const list = ANGLES[topic] || []
  const followed = threadAngle(topic)
  const [chosen, setChosen] = React.useState(followed?.id || list[0]?.id)
  React.useEffect(() => setChosen(followed?.id || list[0]?.id), [topic]) // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = React.useState(-1)
  React.useEffect(() => setOpen(-1), [chosen])
  if (!list.length) return null
  const angle = list.find(a => a.id === chosen) || list[0]
  const items = angle.id === followed?.id ? trailFor(topic) : examplesFor(angle)
  return (
    <div className={styles.debates} data-explore="">
      <ol className={styles.angleList}>
        {list.map((a, i) => (
          <li
            key={a.id}
            className={`${styles.angle} ${a.id === angle.id ? styles.isThreadAngle : ""}`}
            style={{ "--i": i }}
          >
            <button
              type="button"
              className={styles.angleRow}
              aria-pressed={a.id === angle.id}
              onClick={() => setChosen(a.id)}
            >
              <Row a={a} f={f} />
            </button>
          </li>
        ))}
      </ol>
      <Key f={f}>{say(f, NOTES.angles)}</Key>
      <div className={styles.trail}>
        {angle.id !== followed?.id ? (
          <p className={styles.fine}>
            {f.L([
              "Exemples de cet angle, un par source.",
              "Examples from this angle, one per source.",
            ])}
          </p>
        ) : null}
        <ol
          className={styles.trailList}
          aria-label={f.L(["Le fil des sources", "The trail of sources"])}
        >
          {items.map((x, i) => (
            <TrailItem
              key={`${x.k}${x.url}${i}`}
              x={x}
              f={f}
              open={open === i}
              onOpen={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}
