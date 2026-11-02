import * as React from "react"

import {
  BAROMETER_LIST,
  DEBATE,
  EXCEPTION,
  LINKS,
  PRODUCER_LIST,
  QUESTION_LIST,
  SAID,
  SOURCE_COUNTS,
  TOPIC_LIST,
} from "./method-data"
import { TOPICS } from "./topics"
import styles from "./flow.module.css"

// The whole method as one picture: the three barometers, the topics they put
// forward, the questions drawn from the debate on each, and the official
// producers whose data answers them, joined by lines. Pointing at anything
// lights its whole chain; pressing it keeps the chain lit and tells its story
// underneath. Column heads explain each step.

const NODES = [
  ...BAROMETER_LIST.map(b => ({ id: `b:${b.id}`, col: 0, data: b })),
  ...TOPIC_LIST.map(t => ({ id: `t:${t.id}`, col: 1, data: t })),
  ...QUESTION_LIST.map(q => ({ id: `q:${q.id}`, col: 2, data: q })),
  ...PRODUCER_LIST.map(p => ({ id: `p:${p.name[0]}`, col: 3, data: p })),
]
const NODE = Object.fromEntries(NODES.map(n => [n.id, n]))
const EDGES = [
  ...LINKS.map(([b, t]) => [`b:${b}`, `t:${t}`]),
  ...QUESTION_LIST.map(q => [`t:${q.topic}`, `q:${q.id}`]),
  ...QUESTION_LIST.map(q => [`q:${q.id}`, `p:${q.producer[0]}`]),
]
const out = id => EDGES.filter(([a]) => a === id).map(([, b]) => b)
const inc = id => EDGES.filter(([, b]) => b === id).map(([a]) => a)

// Everything upstream and downstream of a node: its whole chain.
const chain = id => {
  const seen = new Set([id])
  const walk = next => {
    const stack = [id]
    while (stack.length)
      for (const n of next(stack.pop()))
        if (!seen.has(n)) {
          seen.add(n)
          stack.push(n)
        }
  }
  walk(out)
  walk(inc)
  return seen
}

const ready = QUESTION_LIST.filter(q => q.ready).length
const kept = TOPIC_LIST.filter(t => t.status === "kept").length
const left = TOPIC_LIST.filter(t => t.status === "out").length

const COLUMNS = f => [
  {
    n: "01",
    title: ["Préoccupations", "Concerns"],
    what: ["3 baromètres", "3 barometers"],
    how: [
      [
        "Trois enquêtes demandent aux Français ce qui les préoccupe le plus : une question ouverte (Priorités françaises) et deux listes fermées (Fractures françaises, Eurobaromètre).",
        "Three surveys ask people in France what concerns them most: one open question (Priorités françaises) and two closed lists (Fractures françaises, Eurobarometer).",
      ],
      [
        "Nous retenons toutes les vagues publiées d'octobre 2025 à octobre 2026.",
        "We use every wave published from October 2025 to October 2026.",
      ],
    ],
  },
  {
    n: "02",
    title: ["Sujets", "Topics"],
    what: [`${kept} + 1 retenus`, `${kept} + 1 kept`],
    how: [
      [
        "Un sujet est retenu s'il figure dans le top 10 d'au moins deux baromètres sur trois. Un trait le relie à chaque baromètre qui le place dans son top 10.",
        "A topic is kept if it is in the top 10 of at least two barometers out of three. A line joins it to each barometer that ranks it in its top 10.",
      ],
      [
        `L'éducation est ajoutée par exception : un seul baromètre, mais ${EXCEPTION.parliament} questions au gouvernement et ${EXCEPTION.government} déclarations. ${left} sujets sont écartés par la règle.`,
        `Education is added as an exception: one barometer only, but ${EXCEPTION.parliament} questions to the government and ${EXCEPTION.government} statements. ${left} topics are left out by the rule.`,
      ],
    ],
  },
  {
    n: "03 · 04",
    title: ["Débat public → Questions", "Public debate → Questions"],
    what: [
      `${f.num(SAID)} prises de parole → ${QUESTION_LIST.length} questions`,
      `${f.num(SAID)} public statements → ${QUESTION_LIST.length} questions`,
    ],
    how: [
      [
        `Pour chaque sujet, nous relevons ce qui a été dit en public : ${f.num(SOURCE_COUNTS.parliament)} questions au gouvernement, ${f.num(SOURCE_COUNTS.government)} déclarations, ${f.num(SOURCE_COUNTS.factchecks)} vérifications.`,
        `For each topic, we gather what was said in public: ${f.num(SOURCE_COUNTS.parliament)} questions to the government, ${f.num(SOURCE_COUNTS.government)} statements, ${f.num(SOURCE_COUNTS.factchecks)} fact-checks.`,
      ],
      [
        "Les sujets précis les plus débattus, par le plus de familles de sources et de groupes de l'Assemblée, deviennent des questions neutres.",
        "The most debated specific subjects, by the most source families and Assemblée groups, become neutral questions.",
      ],
    ],
  },
  {
    n: "05",
    title: ["Données", "Data"],
    what: [
      `${PRODUCER_LIST.length} producteurs officiels`,
      `${PRODUCER_LIST.length} official producers`,
    ],
    how: [
      [
        "Chaque question est confrontée à une série officielle : sa source, sa fréquence, ce qu'elle ne dit pas.",
        "Each question is set against an official series: its source, how often it is updated, what it doesn't say.",
      ],
      [
        `${ready} questions sont déjà chiffrées (points verts), les autres sont en préparation.`,
        `${ready} questions are already answered with data (green dots), the others are in preparation.`,
      ],
    ],
  },
]

// Opens the question in section 01 and brings the reader there.
const openQuestion = id => {
  window.dispatchEvent(new CustomEvent("datalab:question", { detail: id }))
  document.getElementById("state")?.scrollIntoView()
}

const Dot = ({ on }) => (
  <i className={`${styles.dot} ${on ? styles.isReady : ""}`} />
)

const QuestionList = ({ list, f }) => (
  <ul className={styles.qlist}>
    {list.map(q => (
      <li key={q.id}>
        <Dot on={q.ready} />
        {f.L(q.q)}
      </li>
    ))}
  </ul>
)

const Story = ({ id, column, columns, f }) => {
  if (column != null) {
    const c = columns[column]
    return (
      <>
        <span className={`${styles.label} ${styles.isForm}`}>
          {c.n} · {f.L(c.title)}
        </span>
        {c.how.map((t, i) => (
          <p className={styles.lede} key={i}>
            {f.L(t)}
          </p>
        ))}
      </>
    )
  }
  if (!id)
    return (
      <p className={styles.meta}>
        {f.L([
          "Survolez un élément pour voir toute sa chaîne ; cliquez pour la garder et lire son histoire. Les titres de colonne expliquent chaque étape.",
          "Point at anything to see its whole chain; press it to keep it and read its story. The column heads explain each step.",
        ])}
      </p>
    )
  const n = NODE[id]
  if (n.col === 0) {
    const b = n.data
    const topics = out(id).map(t => f.L(TOPICS[t.slice(2)].name))
    return (
      <>
        <span className={`${styles.label} ${styles.isForm}`}>
          {f.L(["Baromètre", "Barometer"])} · {f.L(b.kind)}
        </span>
        <h4 className={styles.panelTitle}>{b.name}</h4>
        <p className={styles.quote}>{b.question}</p>
        <p className={styles.meta}>
          {b.by} · {b.waveCount}{" "}
          {f.L(b.waveCount > 1 ? ["vagues", "waves"] : ["vague", "wave"])} ·{" "}
          {f.L(["dans son top 10 : ", "in its top 10: "])}
          {topics.join(", ")}
        </p>
      </>
    )
  }
  if (n.col === 1) {
    const t = n.data
    const barometers = inc(id).map(b => NODE[b].data.name)
    const questions = QUESTION_LIST.filter(q => q.topic === t.id)
    const d = DEBATE[t.id]
    const status = {
      kept: ["Sujet · retenu", "Topic · kept"],
      exception: [
        "Sujet · ajouté par exception",
        "Topic · added as an exception",
      ],
      out: ["Sujet · écarté par la règle", "Topic · left out by the rule"],
    }[t.status]
    return (
      <>
        <span className={`${styles.label} ${styles.isForm}`}>
          {f.L(status)}
        </span>
        <h4 className={styles.panelTitle}>{f.L(TOPICS[t.id].name)}</h4>
        <p className={styles.meta}>
          {f.L([
            `Dans le top 10 de ${t.count} baromètre${t.count > 1 ? "s" : ""} sur 3`,
            `In the top 10 of ${t.count} barometer${t.count === 1 ? "" : "s"} out of 3`,
          ])}
          {barometers.length
            ? f.L([
                ` : ${barometers.join(", ")}.`,
                `: ${barometers.join(", ")}.`,
              ])
            : "."}
        </p>
        {d ? (
          <p className={styles.meta}>
            {f.L([
              `Débat public : ${d.parliament} questions au gouvernement · ${d.government} déclarations · ${d.factchecks} vérifications · ${d.subjects.length} sujets précis.`,
              `Public debate: ${d.parliament} questions to the government · ${d.government} statements · ${d.factchecks} fact-checks · ${d.subjects.length} specific subjects.`,
            ])}
          </p>
        ) : null}
        {questions.length ? (
          <QuestionList list={questions} f={f} />
        ) : (
          <p className={styles.meta}>
            {f.L(
              t.status === "out"
                ? [
                    "Aucune question : le sujet n'a pas passé la règle.",
                    "No questions: the topic didn't pass the rule.",
                  ]
                : [
                    "Aucune question : non mesurable ici.",
                    "No questions: not measurable here.",
                  ],
            )}
          </p>
        )}
      </>
    )
  }
  if (n.col === 2) {
    const q = n.data
    const c = q.counts
    return (
      <>
        <span className={`${styles.label} ${styles.isForm}`}>
          {f.L(["Question", "Question"])} · {f.L(TOPICS[q.topic].name)}
        </span>
        <h4 className={styles.panelTitle}>{f.L(q.q)}</h4>
        {c ? (
          <p className={styles.meta}>
            {f.L([
              `D'où elle vient : ${c.parliament} questions au gouvernement (${c.groups} groupes) · ${c.government} déclarations · ${c.factchecks} vérifications.`,
              `Where it comes from: ${c.parliament} questions to the government (${c.groups} groups) · ${c.government} statements · ${c.factchecks} fact-checks.`,
            ])}
          </p>
        ) : null}
        {q.perception ? (
          <p className={styles.meta}>
            {f.L([
              "Ce que pensent les Français : ",
              "What people in France think: ",
            ])}
            {f.L(q.perception)}.
          </p>
        ) : null}
        <p className={styles.meta}>
          {f.L(["Données : ", "Data: "])}
          {q.source} ·{" "}
          {f.L(
            q.ready
              ? ["chiffrée", "answered with data"]
              : ["en préparation", "in preparation"],
          )}
          .
        </p>
        <button
          type="button"
          className={styles.more}
          onClick={() => openQuestion(q.id)}
        >
          {f.L(["Ouvrir la question", "Open the question"])} →
        </button>
      </>
    )
  }
  const p = n.data
  return (
    <>
      <span className={`${styles.label} ${styles.isForm}`}>
        {f.L(["Producteur de données", "Data producer"])}
      </span>
      <h4 className={styles.panelTitle}>{f.L(p.name)}</h4>
      <QuestionList list={p.questions} f={f} />
    </>
  )
}

export default function MethodFlow({ f }) {
  const [hover, setHover] = React.useState(null)
  const [pinned, setPinned] = React.useState(null)
  const [column, setColumn] = React.useState(null)
  const [paths, setPaths] = React.useState([])
  const [box, setBox] = React.useState([0, 0])
  const stage = React.useRef(null)
  const refs = React.useRef({})
  const columns = COLUMNS(f)

  // Lines are drawn from where the nodes actually sit, so the layout stays CSS.
  React.useLayoutEffect(() => {
    const draw = () => {
      const s = stage.current
      if (!s) return
      const r0 = s.getBoundingClientRect()
      setBox([r0.width, r0.height])
      setPaths(
        EDGES.map(([a, b]) => {
          const r1 = refs.current[a].getBoundingClientRect()
          const r2 = refs.current[b].getBoundingClientRect()
          const x1 = r1.right - r0.left
          const y1 = r1.top + r1.height / 2 - r0.top
          const x2 = r2.left - r0.left
          const y2 = r2.top + r2.height / 2 - r0.top
          const mx = (x1 + x2) / 2
          return {
            a,
            b,
            d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`,
          }
        }),
      )
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [f.lang])

  const focus = pinned || hover
  const lit = focus ? chain(focus) : null
  const pin = id => {
    setPinned(current => (current === id ? null : id))
    setColumn(null)
  }

  const label = n => {
    if (n.col === 0) return [n.data.name, f.L(n.data.kind)]
    if (n.col === 1) {
      const t = n.data
      return [
        f.L(TOPICS[t.id].name),
        t.status === "exception"
          ? f.L(["par exception", "as an exception"])
          : t.status === "out"
            ? f.L([`écarté · ${t.count}/3`, `left out · ${t.count}/3`])
            : `${t.count}/3`,
      ]
    }
    if (n.col === 2) return [f.L(n.data.q), null]
    return [
      f.L(n.data.name),
      f.L([`${n.data.questions.length} q.`, `${n.data.questions.length} q.`]),
    ]
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
        <div className={styles.flow} ref={stage}>
          <svg
            className={styles.links}
            viewBox={`0 0 ${box[0]} ${box[1]}`}
            aria-hidden="true"
            focusable="false"
          >
            {paths.map(p => {
              const on = lit && lit.has(p.a) && lit.has(p.b)
              return (
                <path
                  key={`${p.a}>${p.b}`}
                  d={p.d}
                  className={`${styles.link} ${on ? styles.isLit : lit ? styles.isDim : ""}`}
                />
              )
            })}
          </svg>
          {columns.map((c, i) => (
            <div className={`${styles.col} ${styles[`col${i}`]}`} key={c.n}>
              <button
                type="button"
                className={styles.colHead}
                aria-pressed={column === i}
                onClick={() => (
                  setColumn(current => (current === i ? null : i)),
                  setPinned(null)
                )}
              >
                <span className={styles.colN}>{c.n}</span>
                <span className={styles.colTitle}>{f.L(c.title)}</span>
                <span className={styles.colWhat}>{f.L(c.what)}</span>
              </button>
              <div className={styles.nodes}>
                {NODES.filter(n => n.col === i).map(n => {
                  const [text, sub] = label(n)
                  const status = n.col === 1 ? n.data.status : null
                  return (
                    <button
                      type="button"
                      key={n.id}
                      ref={node => (refs.current[n.id] = node)}
                      className={[
                        styles.node,
                        styles[`node${n.col}`],
                        status === "exception" ? styles.isException : "",
                        status === "out" ? styles.isOut : "",
                        lit
                          ? lit.has(n.id)
                            ? styles.isLit
                            : styles.isDim
                          : "",
                        pinned === n.id ? styles.isPinned : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={pinned === n.id}
                      onPointerEnter={() => setHover(n.id)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(n.id)}
                      onBlur={() => setHover(null)}
                      onClick={() => pin(n.id)}
                    >
                      {n.col === 2 ? <Dot on={n.data.ready} /> : null}
                      <span className={styles.nodeLabel}>{text}</span>
                      {sub ? (
                        <span className={styles.nodeSub}>{sub}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.panel} aria-live="polite">
        <Story id={pinned} column={column} columns={columns} f={f} />
      </div>
    </div>
  )
}
