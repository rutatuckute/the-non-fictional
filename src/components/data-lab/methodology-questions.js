import * as React from "react"

import ORIGINS from "./data/origins.json"
import STATE from "./data/state.json"
import { buildQuestions } from "./questions"
import { KEPT, TOPICS } from "./topics"
import steps from "./steps.module.css"
import styles from "./questions-steps.module.css"

// How the questions were chosen, in five steps the reader moves through, as
// for the topics: the three sources, what each says per topic, the subjects
// found, the gate and the ranking, the questions. Below it, every subject
// with its counts, for anyone who wants to check. Nothing moves until the
// reader presses a step.

const M = ORIGINS.method
const QUESTIONS = Object.fromEntries(buildQuestions(STATE).map(q => [q.id, q]))
const TOPIC_ROWS = KEPT.filter(t => M.topics[t])

// Within a topic: more source families first, then more parliamentary
// groups, then more items in all.
const total = s => s.parliament + s.government + s.factchecks
const ranked = topic =>
  [...M.topics[topic].subjects].sort(
    (a, b) =>
      b.families - a.families || b.groups - a.groups || total(b) - total(a),
  )

// Where the choice departs from the ranking, it says so.
const EDITORIAL = {
  classes: [
    "Choix éditorial : retenu devant Parcoursup, car ses données sont disponibles et c'est le sujet le plus proche de la vie des lycées.",
    "Editorial choice: kept ahead of Parcoursup, because its data is available and it's the subject closest to lycée life.",
  ],
  fuel_energy: [
    "Choix éditorial : deux questions sur ce sujet, le prix record et les stations à sec.",
    "Editorial choice: two questions on this subject, the record price and stations running dry.",
  ],
}

const SUBJECT_COUNT = TOPIC_ROWS.reduce(
  (n, t) => n + M.topics[t].subjects.length,
  0,
)
const QUESTION_COUNT = TOPIC_ROWS.reduce(
  (n, t) =>
    n + M.topics[t].subjects.reduce((k, s) => k + s.questions.length, 0),
  0,
)
const WITH_PERCEPTION = Object.values(ORIGINS.questions).filter(
  q => q.perception,
).length

const SOURCES = [
  {
    id: "parliament",
    name: ["Assemblée nationale", "Assemblée nationale"],
    what: ["questions au gouvernement", "questions to the government"],
    icon: "parliament",
  },
  {
    id: "government",
    name: ["Gouvernement", "Government"],
    what: ["déclarations (vie-publique.fr)", "statements (vie-publique.fr)"],
    icon: "government",
  },
  {
    id: "factchecks",
    name: ["Vérificateurs", "Fact-checkers"],
    what: ["vérifications", "fact-checks"],
    icon: "factchecks",
  },
]

const Icon = ({ kind }) => (
  <svg
    className={styles.icon}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    {kind === "parliament" ? (
      <>
        <path d="M3 9l9-5 9 5" />
        <path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9" />
        <path d="M3 20h18" />
      </>
    ) : kind === "government" ? (
      <>
        <rect x="5" y="3" width="14" height="18" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ) : (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="M15 15l5 5" />
        <path d="M7.8 10.6l2 2 3.6-3.8" />
      </>
    )}
  </svg>
)

const STEPS = f => [
  {
    title: ["Trois sources", "Three sources"],
    text: [
      `Tout ce qui a été dit en public d'octobre 2025 à octobre 2026, par trois familles de sources. Les questions au gouvernement sont publiées jusqu'au ${f.date(M.sources.parliamentUntil, { day: "numeric", month: "long", year: "numeric" })}.`,
      `Everything said in public from October 2025 to October 2026, by three families of sources. Questions to the government are published up to ${f.date(M.sources.parliamentUntil, { day: "numeric", month: "long", year: "numeric" })}.`,
    ],
  },
  {
    title: ["Par sujet", "By topic"],
    text: [
      "Chaque question, déclaration ou vérification est rattachée aux sujets dont elle parle.",
      "Each question, statement or fact-check is tagged with the topics it deals with.",
    ],
  },
  {
    title: ["Des sujets précis", "Precise subjects"],
    text: [
      `Dans chaque sujet, ce qui revient le plus est regroupé en sujets précis : ${SUBJECT_COUNT} en tout.`,
      `Within each topic, what comes up most is grouped into precise subjects: ${SUBJECT_COUNT} in all.`,
    ],
  },
  {
    title: ["Le filtre et le classement", "The gate and the ranking"],
    text: [
      "Un sujet passe s'il apparaît dans au moins deux familles de sources ou a été vérifié ; tous passent. Ils sont ensuite classés : d'abord le nombre de familles, puis le nombre de groupes de l'Assemblée qui l'ont soulevé.",
      "A subject passes if it appears in at least two families of sources or was fact-checked; all of them pass. They are then ranked: first by the number of families, then by the number of Assemblée groups that raised it.",
    ],
  },
  {
    title: ["Les questions", "The questions"],
    text: [
      "Les premiers sujets de chaque thème deviennent des questions, formulées pour que chacun, d'un bord à l'autre, puisse les accepter.",
      "The top subjects of each topic become questions, worded so that people on either side can accept them.",
    ],
  },
]

export default function MethodQuestions({ f, part }) {
  const [step, setStep] = React.useState(0)
  const list = STEPS(f)
  const maxOf = key => Math.max(...TOPIC_ROWS.map(t => M.topics[t][key]))
  const max = {
    parliament: maxOf("parliament"),
    government: maxOf("government"),
    factchecks: maxOf("factchecks"),
  }

  return (
    <div className={styles.wrap}>
      {part === "table" ? null : (
        <figure className={steps.steps}>
          <div className={steps.caption} aria-live="polite">
            <span className={steps.stepNo}>
              {step + 1}/{list.length}
            </span>
            <span className={steps.stepTitle}>{f.L(list[step].title)}</span>
            <span className={steps.stepText}>{f.L(list[step].text)}</span>
          </div>

          <div className={styles.stage} data-step={step}>
            <div className={styles.sources}>
              {SOURCES.map(s => (
                <div className={styles.source} key={s.id}>
                  <span className={styles.iconRing}>
                    <Icon kind={s.icon} />
                  </span>
                  <span className={styles.sourceName}>{f.L(s.name)}</span>
                  <span className={styles.sourceCount}>
                    {f.num(M.sources[s.id])}
                  </span>
                  <span className={styles.sourceWhat}>{f.L(s.what)}</span>
                </div>
              ))}
            </div>

            {step >= 1 ? (
              <div className={styles.rows}>
                {TOPIC_ROWS.map(topic => {
                  const T = M.topics[topic]
                  const subjects = ranked(topic)
                  return (
                    <div className={styles.row} key={topic}>
                      <span className={styles.topic}>
                        {f.L(TOPICS[topic].short)}
                        {TOPICS[topic].exception ? (
                          <span className={styles.flag}>
                            {f.L(["exception", "exception"])}
                          </span>
                        ) : null}
                      </span>

                      {step === 1 ? (
                        <span className={styles.bars}>
                          {SOURCES.map(s => (
                            <span
                              className={styles.bar}
                              key={s.id}
                              title={`${f.L(s.name)} · ${f.num(T[s.id])}`}
                            >
                              <i
                                style={{
                                  width: `${(T[s.id] / max[s.id]) * 100}%`,
                                }}
                              />
                              <b>{f.num(T[s.id])}</b>
                            </span>
                          ))}
                        </span>
                      ) : step < 4 ? (
                        <span className={styles.pills}>
                          {subjects.map((s, rank) => {
                            const kept = step === 3 && s.questions.length
                            const dropped = step === 3 && !s.questions.length
                            return (
                              <span
                                key={s.id}
                                className={`${styles.pill} ${kept ? styles.isKept : ""} ${dropped ? styles.isDropped : ""}`}
                                title={`${f.L(s.name)} · ${f.L(["familles", "families"])} ${s.families}/3 · ${f.L(["groupes", "groups"])} ${s.groups} · ${f.L(["Assemblée", "Assemblée"])} ${s.parliament} · ${f.L(["Gouvernement", "Government"])} ${s.government} · ${f.L(["Vérifications", "Fact-checks"])} ${s.factchecks}`}
                              >
                                {step === 3 ? (
                                  <span className={styles.rank}>
                                    {rank + 1}
                                  </span>
                                ) : null}
                                {f.L(s.name)}
                                {step === 3 ? (
                                  <span className={styles.pillMeta}>
                                    {s.families}/3 · {s.groups}{" "}
                                    {f.L(["gr.", "gr."])}
                                  </span>
                                ) : null}
                                {step === 3 && EDITORIAL[s.id] ? (
                                  <span className={styles.editorial}>
                                    {f.L([
                                      "choix éditorial",
                                      "editorial choice",
                                    ])}
                                  </span>
                                ) : null}
                              </span>
                            )
                          })}
                        </span>
                      ) : (
                        <ul className={styles.questions}>
                          {subjects
                            .flatMap(s => s.questions)
                            .map(id => (
                              <li key={id}>{f.L(QUESTIONS[id].q)}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null}

            {step === 1 ? (
              <div className={styles.legend}>
                {SOURCES.map((s, i) => (
                  <span key={s.id}>
                    <i className={styles[`key${i}`]} />
                    {f.L(s.name)}
                  </span>
                ))}
              </div>
            ) : null}
            {step === 3 ? (
              <ul className={styles.notes}>
                {Object.values(EDITORIAL).map(note => (
                  <li key={note[1]}>{f.L(note)}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div
            className={`${steps.result} ${step === 4 ? steps.isShown : ""}`}
            aria-hidden={step !== 4}
          >
            <span className={steps.figure}>
              <b>{SUBJECT_COUNT}</b>{" "}
              {f.L(["sujets précis", "precise subjects"])}
            </span>
            <span className={steps.figure}>
              <b>{QUESTION_COUNT}</b> {f.L(["questions", "questions"])}
            </span>
            <span className={steps.figure}>
              <b>{WITH_PERCEPTION}</b>{" "}
              {f.L([
                "avec ce que pensent les Français",
                "with what people in France think",
              ])}
            </span>
          </div>

          <div className={steps.controls}>
            <button
              type="button"
              className={steps.nav}
              aria-label={f.L(["Étape précédente", "Previous step"])}
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              ←{" "}
              <span className={steps.navText}>
                {f.L(["Précédent", "Previous"])}
              </span>
            </button>
            <div
              className={steps.dots}
              role="group"
              aria-label={f.L(["Étapes", "Steps"])}
            >
              {list.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className={steps.dot}
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
              className={`${steps.nav} ${steps.isNext}`}
              aria-label={f.L(["Étape suivante", "Next step"])}
              onClick={() => setStep(s => Math.min(list.length - 1, s + 1))}
              disabled={step === list.length - 1}
            >
              <span className={steps.navText}>{f.L(["Suivant", "Next"])}</span>{" "}
              →
            </button>
          </div>
        </figure>
      )}

      {part === "steps" ? null : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{f.L(["Sujet", "Subject"])}</th>
              <th>{f.L(["Familles", "Families"])}</th>
              <th>{f.L(["Assemblée (groupes)", "Assemblée (groups)"])}</th>
              <th>{f.L(["Gouvernement", "Government"])}</th>
              <th>{f.L(["Vérifications", "Fact-checks"])}</th>
              <th>{f.L(["Question", "Question"])}</th>
            </tr>
          </thead>
          {TOPIC_ROWS.map(topic => (
            <tbody key={topic}>
              <tr className={styles.topicRow}>
                <th colSpan={6}>{f.L(TOPICS[topic].name)}</th>
              </tr>
              {ranked(topic).map(s => (
                <tr
                  key={s.id}
                  className={s.questions.length ? "" : styles.isDropped}
                >
                  <td>{f.L(s.name)}</td>
                  <td>{s.families}/3</td>
                  <td>
                    {s.parliament} ({s.groups})
                  </td>
                  <td>{s.government}</td>
                  <td>{s.factchecks}</td>
                  <td>
                    {s.questions.length
                      ? s.questions.map(id => f.L(QUESTIONS[id].q)).join(" · ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      )}
    </div>
  )
}
