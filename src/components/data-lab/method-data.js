import DATA from "./data/topics.json"
import ORIGINS from "./data/origins.json"
import STATE from "./data/state.json"
import { BAROMETERS, ORDER } from "./barometers"
import { buildQuestions } from "./questions"
import { EXCEPTIONS, KEPT } from "./topics"

// The whole method as one graph, read from the page's own exports so every
// number matches section 01: the barometers, the topics they put in their
// top 10, the questions drawn from the debate on each topic, and the official
// producer whose data answers each question.

const { decision } = DATA

export const BAROMETER_LIST = ORDER.map(id => ({
  id,
  ...BAROMETERS[id],
  waveCount: Object.keys(BAROMETERS[id].waves).length,
}))

const statusOf = t =>
  decision[t].in ? "kept" : EXCEPTIONS.includes(t) ? "exception" : "out"
const OUT = Object.keys(decision)
  .filter(t => statusOf(t) === "out")
  .sort(
    (a, b) =>
      decision[b].count - decision[a].count ||
      decision[b].countMax - decision[a].countMax,
  )
export const TOPIC_LIST = [...KEPT, ...OUT].map(id => ({
  id,
  status: statusOf(id),
  count: decision[id].count,
}))

// A barometer is joined to a topic when one of its items for that topic is
// surely in its top 10.
export const LINKS = [
  ...new Set(
    DATA.items
      .filter(
        it =>
          decision[it.topic] && Math.max(it.rank, it.rankHigh) <= DATA.rule.top,
      )
      .map(it => `${it.barometer}|${it.topic}`),
  ),
].map(k => k.split("|"))

// The main producer of each question's data, named short.
const PRODUCER = {
  prices: ["Eurostat", "Eurostat"],
  fuel: ["Commission européenne", "European Commission"],
  fuel_eu: ["Commission européenne", "European Commission"],
  shortage: ["Ministère de l'Économie", "Ministry of the Economy"],
  violence: ["SSMSI (Intérieur)", "SSMSI (Interior)"],
  sexual_violence: ["SSMSI (Intérieur)", "SSMSI (Interior)"],
  immigration: ["DGEF (Intérieur)", "DGEF (Interior)"],
  removals: ["DGEF (Intérieur)", "DGEF (Interior)"],
  debt: ["Insee", "Insee"],
  tax_fairness: ["Insee", "Insee"],
  doctors: ["DREES", "DREES"],
  mental_health: ["Santé publique France", "Santé publique France"],
  heat: ["Météo-France", "Météo-France"],
  emissions: ["Citepa", "Citepa"],
  industry: ["Insee", "Insee"],
  farm_income: ["Insee", "Insee"],
  unemployment: ["Insee", "Insee"],
  youth: ["Insee", "Insee"],
  pensioners: ["Insee", "Insee"],
  fraud: ["CNAF · CNAM", "CNAF · CNAM"],
  teachers: ["DEPP (Éducation)", "DEPP (Education)"],
  school_spending: ["DEPP (Éducation)", "DEPP (Education)"],
  classes: ["DEPP (Éducation)", "DEPP (Education)"],
}

export const QUESTION_LIST = buildQuestions(STATE).map(q => ({
  id: q.id,
  topic: q.topic,
  q: q.q,
  ready: !q.prep,
  producer: PRODUCER[q.id],
  source: q.prep ? q.prep.source : q.source.producer,
  cadence: q.prep ? q.prep.cadence : q.source.cadence,
  counts: ORIGINS.questions[q.id]?.counts,
  perception: ORIGINS.questions[q.id]?.perception?.text,
}))

// Producers, the busiest first.
export const PRODUCER_LIST = [...new Set(QUESTION_LIST.map(q => q.producer[0]))]
  .map(name => ({
    name: QUESTION_LIST.find(q => q.producer[0] === name).producer,
    questions: QUESTION_LIST.filter(q => q.producer[0] === name),
  }))
  .sort((a, b) => b.questions.length - a.questions.length)

export const SOURCE_COUNTS = ORIGINS.method.sources
export const SAID =
  SOURCE_COUNTS.parliament + SOURCE_COUNTS.government + SOURCE_COUNTS.factchecks
export const DEBATE = ORIGINS.method.topics
export const SUBJECT_COUNT = Object.values(DEBATE).reduce(
  (n, t) => n + t.subjects.length,
  0,
)
export const EXCEPTION = ORIGINS.exception.education
