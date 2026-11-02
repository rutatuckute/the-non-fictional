import DECISION from "./data/topics.json"

// The topics of the Data Lab, as chosen by the rule in the method section
// (scripts/data-lab/export-topics.py), plus the candidates the rule left out.
// measurable: false marks a topic people rank high that our data can't answer.
export const TOPICS = {
  cost: {
    name: ["Pouvoir d'achat", "Cost of living"],
    short: ["Pouvoir d'achat", "Cost of living"],
  },
  security: {
    name: ["Délinquance et sécurité", "Crime and security"],
    short: ["Sécurité", "Security"],
  },
  immigration: {
    name: ["Immigration", "Immigration"],
    short: ["Immigration", "Immigration"],
  },
  public: {
    name: ["Dette et finances publiques", "Debt and public finances"],
    short: ["Dette", "Debt"],
  },
  health: { name: ["Santé", "Health"], short: ["Santé", "Health"] },
  environment: {
    name: ["Environnement et climat", "Environment and climate"],
    short: ["Environnement", "Environment"],
  },
  economy: {
    name: ["Économie", "The economy"],
    short: ["Économie", "Economy"],
  },
  jobs: {
    name: ["Emploi et chômage", "Jobs and unemployment"],
    short: ["Emploi", "Jobs"],
  },
  social: {
    name: ["Retraites et protection sociale", "Pensions and social protection"],
    short: ["Retraites", "Pensions"],
  },
  world: {
    name: ["Guerres et situation internationale", "Wars and the world"],
    short: ["International", "World"],
    measurable: false,
  },
  politics: {
    name: ["Vie politique", "Political life"],
    short: ["Vie politique", "Politics"],
  },
  inequality: {
    name: ["Inégalités", "Inequality"],
    short: ["Inégalités", "Inequality"],
  },
  education: {
    name: ["Éducation", "Education"],
    short: ["Éducation", "Education"],
    exception: true,
  },
  housing: { name: ["Logement", "Housing"], short: ["Logement", "Housing"] },
  epidemics: {
    name: ["Épidémies", "Epidemics"],
    short: ["Épidémies", "Epidemics"],
  },
}

// Topics in the order of the decision: kept first, by how many barometers rank
// them, then the ones the rule left out.
const { decision } = DECISION
export const ORDER = Object.keys(decision).sort(
  (a, b) =>
    decision[b].in - decision[a].in ||
    decision[b].count - decision[a].count ||
    decision[b].countMax - decision[a].countMax,
)
// Topics added outside the rule, each declared and explained in the method
// section. Education: heavily debated in politics, low in the barometers'
// rankings, partly because most waves predate the lycéen movement.
export const EXCEPTIONS = ["education"]
export const KEPT = [...ORDER.filter(t => decision[t].in), ...EXCEPTIONS]
export { decision as DECISION }
