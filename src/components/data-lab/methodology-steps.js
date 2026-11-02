import * as React from "react"

import DATA from "./data/topics.json"
import { EXCEPTIONS, ORDER, TOPICS } from "./topics"
import styles from "./steps.module.css"

// How the topics were chosen, in five steps the reader moves through. Nothing
// moves until they press a step: the three barometers, the top 10 taken from
// each, the same concerns grouped into one topic, the rule, the result. Each
// item is one token that travels from its barometer's column to its topic's
// row, where it becomes a dot.

const SOURCES = [
  {
    id: "obsoco",
    name: "Priorités françaises",
    short: "Priorités",
    kind: ["Question ouverte", "Open question"],
    icon: "open",
  },
  {
    id: "fractures",
    name: "Fractures françaises",
    short: "Fractures",
    kind: ["Liste fermée", "Closed list"],
    icon: "list",
  },
  {
    id: "eurobarometer",
    name: "Eurobaromètre",
    short: "Eurobaro.",
    kind: ["Liste fermée", "Closed list"],
    icon: "eu",
  },
]

// Each barometer's item, shortened to a few words, in both languages.
const SHORT = {
  "Inflation, prix et taux d'intérêt": [
    "Inflation et prix",
    "Inflation and prices",
  ],
  "Justice et criminalité": ["Justice et criminalité", "Justice and crime"],
  "Régulation de la vie politique et éthique gouvernementale": [
    "Vie politique",
    "Political life",
  ],
  Immigration: ["Immigration", "Immigration"],
  "Budget et dette nationale": ["Budget et dette", "Budget and debt"],
  "Environnement, pollution et climat": ["Environnement", "Environment"],
  "Politique macroéconomique": ["Macroéconomie", "Macroeconomy"],
  "Marché de l'emploi et chômage": ["Emploi et chômage", "Jobs"],
  "Politique sociale": ["Politique sociale", "Social policy"],
  "Les difficultés en termes de pouvoir d'achat": [
    "Pouvoir d'achat",
    "Purchasing power",
  ],
  "Le niveau de la délinquance": ["Délinquance", "Crime"],
  "Le niveau de l'immigration": ["Immigration", "Immigration"],
  "La protection de l'environnement": ["Environnement", "Environment"],
  "L'avenir du système social de santé": ["Système de santé", "Health system"],
  "Le niveau de la dette et des déficits": [
    "Dette et déficits",
    "Debt and deficits",
  ],
  "L'avenir des retraites": ["Retraites", "Pensions"],
  "La guerre en Ukraine": ["Guerre en Ukraine", "War in Ukraine"],
  "La montée des inégalités sociales": ["Inégalités", "Inequality"],
  "La menace terroriste": ["Terrorisme", "Terrorism"],
  "Rising prices / inflation / cost of living": [
    "Hausse des prix",
    "Rising prices",
  ],
  "The economic situation": ["Situation économique", "Economic situation"],
  "Government debt": ["Dette publique", "Government debt"],
  Crime: ["Criminalité", "Crime"],
  Health: ["Santé", "Health"],
  "The education system": ["Éducation", "Education"],
  "Security and defence": ["Sécurité et défense", "Security and defence"],
  Unemployment: ["Chômage", "Unemployment"],
  "The international situation": [
    "Situation internationale",
    "International situation",
  ],
}

// The items each barometer certainly ranks in its top 10. ObSoCo's 10th place
// is not known for sure (only each wave's top 10 is published), so it gives 9.
const PULLED = SOURCES.map(s =>
  DATA.items
    .filter(it => it.barometer === s.id && Math.max(it.rank, it.rankHigh) <= 10)
    .sort((a, b) => a.rank - b.rank),
)
const TOKENS = PULLED.flatMap((items, column) =>
  items.map((it, row) => ({
    key: `${column}-${it.item}`,
    column,
    row,
    item: it.item,
    topic: it.topic,
  })),
)
const ROWS = ORDER.filter(t => TOKENS.some(tk => tk.topic === t))
const COUNT = topic =>
  new Set(TOKENS.filter(tk => tk.topic === topic).map(tk => tk.column)).size
const KEPT = ROWS.filter(t => COUNT(t) >= DATA.rule.of)
const DROPPED = ROWS.filter(t => COUNT(t) < DATA.rule.of)

const STEPS = [
  {
    title: ["Trois baromètres", "Three barometers"],
    text: [
      "Chacun demande aux Français ce qui les préoccupe le plus, à sa façon.",
      "Each asks people in France what concerns them most, in its own way.",
    ],
  },
  {
    title: ["Leur top 10", "Their top 10"],
    text: [
      `De chacun, nous prenons le top 10 sur un an : ${TOKENS.length} éléments. Pour Priorités françaises, le 10e rang n'est pas connu avec certitude, d'où 9.`,
      `From each, we take its top 10 over a year: ${TOKENS.length} items. For Priorités françaises the 10th place isn't known for sure, hence 9.`,
    ],
  },
  {
    title: ["Regroupés", "Grouped"],
    text: [
      `Les mêmes préoccupations, formulées différemment, forment un seul sujet : ${ROWS.length} sujets.`,
      `The same concerns, worded differently, form one topic: ${ROWS.length} topics.`,
    ],
  },
  {
    title: ["La règle", "The rule"],
    text: [
      `Un sujet est retenu s'il est dans le top 10 d'au moins ${DATA.rule.of} baromètres sur 3.`,
      `A topic is kept if it is in the top 10 of at least ${DATA.rule.of} barometers out of 3.`,
    ],
  },
  {
    title: ["Le résultat", "The result"],
    text: [
      "Les sujets retenus organisent L'état des choses. L'éducation y est ajoutée par exception, expliquée plus bas.",
      "The kept topics organise The state of things. Education is added as an exception, explained below.",
    ],
  },
]

const Icon = ({ kind }) => (
  <svg
    className={styles.icon}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    {kind === "open" ? (
      <>
        <path d="M4 5h16v11H9l-5 4z" />
        <path d="M8 9h8" />
        <path d="M8 12h5" />
      </>
    ) : kind === "list" ? (
      <>
        <path d="M4 6l1.5 1.5L8 5" />
        <path d="M4 12l1.5 1.5L8 11" />
        <rect x="4" y="17" width="4" height="3" />
        <path d="M11 6.5h9" />
        <path d="M11 12.5h9" />
        <path d="M11 18.5h9" />
      </>
    ) : (
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <circle
            key={i}
            cx={12 + Math.cos(a) * 7.5}
            cy={12 + Math.sin(a) * 7.5}
            r={1.1}
          />
        )
      })
    )}
  </svg>
)

// Where things sit. Before the grouping the three columns share the whole
// width; from the grouping on they move right to make room for the topic
// labels. Rows are 30px apart under the heads.
const SPREAD = [17, 50, 83]
const GROUPED = { wide: [47, 67.5, 88], narrow: [60, 76, 92] }
const LABELS = { wide: 34, narrow: 50 }
const ROW = 30
const TOP = 112

const useNarrow = () => {
  const [narrow, setNarrow] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)")
    const update = () => setNarrow(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return narrow
}

export default function MethodSteps({ f }) {
  const [step, setStep] = React.useState(0)
  const grouped = step >= 2
  const ruled = step >= 3
  const done = step >= 4
  const narrow = useNarrow()
  const columns = grouped ? GROUPED[narrow ? "narrow" : "wide"] : SPREAD
  const height = TOP + Math.max(10, ROWS.length) * ROW + 8

  const tokenStyle = tk => {
    if (step === 0)
      return { left: `${columns[tk.column]}%`, top: 52, opacity: 0 }
    if (!grouped)
      return { left: `${columns[tk.column]}%`, top: TOP + tk.row * ROW }
    const row = ROWS.indexOf(tk.topic)
    const faded =
      ruled &&
      COUNT(tk.topic) < DATA.rule.of &&
      !(done && EXCEPTIONS.includes(tk.topic))
    return {
      left: `${columns[tk.column]}%`,
      top: TOP + row * ROW,
      opacity: faded ? 0.25 : 1,
    }
  }

  return (
    <figure className={styles.steps}>
      <div className={styles.caption} aria-live="polite">
        <span className={styles.stepNo}>
          {step + 1}/{STEPS.length}
        </span>
        <span className={styles.stepTitle}>{f.L(STEPS[step].title)}</span>
        <span className={styles.stepText}>{f.L(STEPS[step].text)}</span>
      </div>

      <div className={styles.stage} style={{ height }} data-step={step}>
        {SOURCES.map((s, column) => (
          <div
            className={`${styles.source} ${grouped ? styles.isGrouped : ""}`}
            key={s.id}
            style={{ left: `${columns[column]}%` }}
          >
            <span className={styles.iconRing}>
              <Icon kind={s.icon} />
            </span>
            <span className={styles.sourceName}>{s.name}</span>
            <span className={styles.sourceShort}>{s.short}</span>
            <span className={styles.sourceKind}>
              {step === 1
                ? f.L([
                    `${PULLED[column].length} éléments`,
                    `${PULLED[column].length} items`,
                  ])
                : f.L(s.kind)}
            </span>
          </div>
        ))}

        {ROWS.map((topic, row) => {
          const n = COUNT(topic)
          const exception = done && EXCEPTIONS.includes(topic)
          const out = ruled && n < DATA.rule.of && !exception
          return (
            <div
              key={topic}
              className={`${styles.topicRow} ${grouped ? styles.isShown : ""} ${out ? styles.isOut : ""}`}
              style={{
                top: TOP + row * ROW,
                width: `${LABELS[narrow ? "narrow" : "wide"]}%`,
              }}
            >
              <span className={styles.topicName}>
                {f.L(TOPICS[topic].short)}
                {done && TOPICS[topic].measurable === false ? (
                  <span className={styles.flag}>
                    {f.L(["non mesurable ici", "not measurable here"])}
                  </span>
                ) : null}
                {exception ? (
                  <span className={styles.flag}>
                    {f.L(["exception", "exception"])}
                  </span>
                ) : null}
              </span>
              <span
                className={`${styles.topicCount} ${ruled ? styles.isShown : ""}`}
              >
                {n}/3
              </span>
            </div>
          )
        })}

        {TOKENS.map(tk => (
          <span
            key={tk.key}
            className={`${styles.token} ${grouped ? styles.isDot : ""}`}
            style={tokenStyle(tk)}
            title={f.L(SHORT[tk.item] || [tk.item, tk.item])}
          >
            <span className={styles.tokenText}>
              {f.L(SHORT[tk.item] || [tk.item, tk.item])}
            </span>
          </span>
        ))}
      </div>

      <div
        className={`${styles.result} ${done ? styles.isShown : ""}`}
        aria-hidden={!done}
      >
        <span className={styles.figure}>
          <b>{KEPT.length}</b> {f.L(["sujets retenus", "topics kept"])}
        </span>
        <span className={styles.figure}>
          <b>+{EXCEPTIONS.length}</b>{" "}
          {f.L(["par exception", "as an exception"])}
        </span>
        <span className={styles.figure}>
          <b>
            {DROPPED.length -
              EXCEPTIONS.filter(t => DROPPED.includes(t)).length}
          </b>{" "}
          {f.L(["écartés", "left out"])}
        </span>
        <span className={styles.figure}>
          <b>{KEPT.filter(t => TOPICS[t].measurable === false).length}</b>{" "}
          {f.L(["non mesurable ici", "not measurable here"])}
        </span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.nav}
          aria-label={f.L(["Étape précédente", "Previous step"])}
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ←{" "}
          <span className={styles.navText}>
            {f.L(["Précédent", "Previous"])}
          </span>
        </button>
        <div
          className={styles.dots}
          role="group"
          aria-label={f.L(["Étapes", "Steps"])}
        >
          {STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              className={styles.dot}
              aria-pressed={i === step}
              aria-label={`${i + 1}. ${f.L(s.title)}`}
              onClick={() => setStep(i)}
            >
              <span>{i + 1}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.nav} ${styles.isNext}`}
          aria-label={f.L(["Étape suivante", "Next step"])}
          onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
        >
          <span className={styles.navText}>{f.L(["Suivant", "Next"])}</span> →
        </button>
      </div>
    </figure>
  )
}
