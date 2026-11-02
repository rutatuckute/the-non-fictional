// The questions of "The state of things". Each comes from claims made in
// public debate and is answered with an official series: a headline figure,
// a chart, a map where the data has a département breakdown, what the data
// can't tell, and its source. Questions without data yet say what will come.
// Every text is a pair, [French, English].

import { buildMore } from "./questions-more"
import { TOPICS } from "./topics"

export { TOPICS }

export const COUNTRIES = {
  FR: ["France", "France"],
  DE: ["Allemagne", "Germany"],
  IT: ["Italie", "Italy"],
  ES: ["Espagne", "Spain"],
  BE: ["Belgique", "Belgium"],
  NL: ["Pays-Bas", "Netherlands"],
  LU: ["Luxembourg", "Luxembourg"],
  EA: ["Zone euro", "Euro area"],
}

const lastIndex = values => {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] != null) return i
  return -1
}
const peakIndex = values =>
  values.reduce((best, v, i) => (v != null && v > values[best] ? i : best), 0)

// Ticks: one label per chosen period, as indexes into the series.
const yearTicks = (labels, test) =>
  labels
    .map((l, i) => [l, i])
    .filter(([l]) => test(l))
    .map(([, i]) => i)

export const buildQuestions = S => {
  const more = buildMore(S)
  const H = S.hicp
  const m = lastIndex(H["FR:TOTAL"])
  const w = lastIndex(S.fuel.diesel)
  const wPeak = peakIndex(S.fuel.diesel)
  const peak2022 = Math.max(
    ...S.fuel.diesel.filter(
      (v, i) => v != null && S.weeks[i].startsWith("2022"),
    ),
  )
  const d = S.days.length - 1
  const dPeak = peakIndex(S.short)
  const q = S.quarters.length - 1

  const SOURCES = {
    hicp: {
      producer: "Eurostat · IPCH (indice des prix à la consommation harmonisé)",
      cadence: ["Mensuelle", "Monthly"],
      latest: f => f.month(S.months[m]),
      next: [
        "≈ un mois après la fin du mois",
        "≈ a month after the month ends",
      ],
      type: "official",
    },
    oil: {
      producer: "Commission européenne · Weekly Oil Bulletin",
      cadence: ["Hebdomadaire", "Weekly"],
      latest: f =>
        f.date(S.weeks[w], { day: "numeric", month: "long", year: "numeric" }),
      next: ["lundi prochain", "next Monday"],
      type: "official",
    },
    pump: {
      producer: "Ministère de l'Économie · prix-carburants (≈ 9 800 stations)",
      cadence: ["Quotidienne", "Daily"],
      latest: f =>
        f.date(S.days[d], { day: "numeric", month: "long", year: "numeric" }),
      next: ["demain", "tomorrow"],
      type: "official",
    },
    unemp: {
      producer: "Insee · Enquête Emploi, chômage au sens du BIT",
      cadence: ["Trimestrielle", "Quarterly"],
      latest: f => f.quarter(S.quarters[q]),
      next: [
        "≈ six semaines après la fin du trimestre",
        "≈ six weeks after the quarter ends",
      ],
      type: "official",
    },
    school: {
      producer:
        "DEPP · ministère de l'Éducation nationale (moyens d'enseignement du second degré)",
      cadence: ["Annuelle, à chaque rentrée", "Yearly, each school year"],
      latest: () => `${S.school.years[S.school.years.length - 1]}`,
      next: ["rentrée suivante (novembre)", "next school year (November)"],
      type: "official",
    },
  }

  const monthTicks = yearTicks(S.months, l => l.endsWith("-01"))
  const weekTicks = S.weeks
    .map((wk, i) => [wk, i])
    .filter(
      ([wk], i) => i === 0 || wk.slice(0, 4) !== S.weeks[i - 1].slice(0, 4),
    )
    .filter(([wk]) => +wk.slice(0, 4) % 3 === 2)
    .map(([, i]) => i)
  const dayTicks = yearTicks(S.days, l => /-(01|07)-01$/.test(l))
  const quarterTicks = yearTicks(
    S.quarters,
    l => l.endsWith("Q1") && +l.slice(0, 4) % 2 === 1,
  )

  return [
    {
      id: "prices",
      topic: "cost",
      q: ["Les prix augmentent-ils encore ?", "Are prices still rising?"],
      spark: H["FR:TOTAL"].slice(-37),
      value: f => f.pct(H["FR:TOTAL"][m]),
      headline: f => ({
        label: [
          `sur un an, ${f.month(S.months[m])}`,
          `year on year, ${f.month(S.months[m])}`,
        ],
        vs: [
          `${f.pct(H["FR:TOTAL"][m - 12])} il y a un an · zone euro ${f.pct(H["EA:TOTAL"][m])}`,
          `${f.pct(H["FR:TOTAL"][m - 12])} a year ago · euro area ${f.pct(H["EA:TOTAL"][m])}`,
        ],
      }),
      chart: f => ({
        x: S.months,
        series: [
          { label: "France", values: H["FR:TOTAL"], emph: true },
          { label: f.L(COUNTRIES.EA), values: H["EA:TOTAL"] },
        ],
        fmtY: v => f.pct(v),
        fmtX: (x, short) => (short ? x.slice(0, 4) : f.month(x)),
        ticks: monthTicks,
        reference: { value: 2, label: f.L(["cible BCE 2 %", "ECB target 2%"]) },
      }),
      tiles: [
        ["CP011", ["Alimentation", "Food"]],
        ["NRG", ["Énergie", "Energy"]],
        ["CP0411", ["Loyers", "Rents"]],
        ["TOT_X_NRG_FOOD", ["Inflation sous-jacente", "Core inflation"]],
      ].map(([k, label]) => ({
        label,
        value: H[`FR:${k}`][m],
        series: H[`FR:${k}`].slice(-37),
      })),
      cant: [
        [
          "Une inflation qui ralentit veut dire que les prix montent moins vite, pas qu'ils baissent.",
          "Slowing inflation means prices rise more slowly, not that they fall.",
        ],
        [
          "Ce que vit chaque ménage : le panier varie selon le lieu de vie, l'âge et le revenu.",
          "What each household experiences: the basket varies with place, age and income.",
        ],
        [
          "L'IPCH européen et l'IPC de l'Insee diffèrent légèrement ; nous utilisons l'IPCH pour comparer avec les voisins.",
          "Eurostat's HICP and Insee's CPI differ slightly; we use the HICP to compare with neighbours.",
        ],
      ],
      source: SOURCES.hicp,
    },
    {
      id: "fuel",
      topic: "cost",
      q: [
        "Le carburant n'a-t-il jamais été aussi cher ?",
        "Has fuel never been this expensive?",
      ],
      spark: S.fuel.diesel.slice(-160),
      value: f => f.eur(S.fuel.diesel[w]),
      headline: f => ({
        label: [
          `le litre de gazole, semaine du ${f.date(S.weeks[w])}`,
          `per litre of diesel, week of ${f.date(S.weeks[w])}`,
        ],
        vs: [
          `sommet : ${f.eur(S.fuel.diesel[wPeak])} le ${f.date(S.weeks[wPeak], { day: "numeric", month: "short", year: "numeric" })} · sommet de 2022 : ${f.eur(peak2022)}`,
          `peak: ${f.eur(S.fuel.diesel[wPeak])} on ${f.date(S.weeks[wPeak], { day: "numeric", month: "short", year: "numeric" })} · 2022 peak: ${f.eur(peak2022)}`,
        ],
      }),
      chart: f => ({
        x: S.weeks,
        series: [
          {
            label: f.L(["Gazole", "Diesel"]),
            values: S.fuel.diesel,
            emph: true,
          },
          { label: "SP95", values: S.fuel.euro_super_95 },
        ],
        fmtY: v => f.eur(v),
        fmtX: (x, short) =>
          short
            ? x.slice(0, 4)
            : f.date(x, { day: "numeric", month: "short", year: "numeric" }),
        ticks: weekTicks,
      }),
      map: {
        values: S.dieselDep,
        fmt: f => f.eur,
        caption: f => [
          `Prix médian du gazole par département, ${f.date(S.days[d])}`,
          `Median diesel price by département, ${f.date(S.days[d])}`,
        ],
        source: SOURCES.pump,
      },
      cant: [
        [
          "Les prix sont en euros courants, non corrigés de l'inflation. Nous publierons aussi la série corrigée.",
          "Prices are in current euros, not adjusted for inflation. We will also publish the adjusted series.",
        ],
        [
          "Une moyenne nationale : les prix varient d'une station et d'un département à l'autre (carte ci-dessous).",
          "A national average: prices vary from one station and département to the next (map below).",
        ],
      ],
      source: SOURCES.oil,
    },
    {
      id: "fuel_eu",
      topic: "cost",
      q: [
        "La France paie-t-elle plus cher à la pompe que ses voisins ?",
        "Does France pay more at the pump than its neighbours?",
      ],
      spark: null,
      value: f => f.eur(S.fuelEu.rows.find(r => r[0] === "FR")[1]),
      headline: f => {
        const fr = S.fuelEu.rows.find(r => r[0] === "FR")
        const rank =
          S.fuelEu.rows
            .filter(r => r[0] !== "EA")
            .findIndex(r => r[0] === "FR") + 1
        const n = S.fuelEu.rows.filter(r => r[0] !== "EA").length
        const taxes = f.pct((1 - fr[2] / fr[1]) * 100, 0)
        return {
          label: [
            `gazole en France, ${rank}e sur ${n} pays comparés`,
            `diesel in France, ${rank}${["st", "nd", "rd"][rank - 1] || "th"} of ${n} countries compared`,
          ],
          vs: [
            `dont ${taxes} de taxes · ${f.eur(S.fuelEu.yearAgo.FR)} il y a un an`,
            `of which ${taxes} taxes · ${f.eur(S.fuelEu.yearAgo.FR)} a year ago`,
          ],
        }
      },
      bars: true,
      cant: [
        [
          "Le pouvoir d'achat diffère d'un pays à l'autre : un litre au même prix ne pèse pas pareil sur chaque salaire.",
          "Purchasing power differs between countries: a litre at the same price doesn't weigh the same on every wage.",
        ],
        [
          "Les prix sont déclarés chaque semaine par chaque État membre, avec des méthodes un peu différentes.",
          "Prices are reported weekly by each member state, with slightly different methods.",
        ],
      ],
      source: SOURCES.oil,
    },
    {
      id: "shortage",
      topic: "cost",
      q: [
        "Les stations-service sont-elles à sec ?",
        "Are petrol stations running dry?",
      ],
      spark: S.short.slice(-120),
      value: f => f.pct(S.short[d]),
      headline: f => ({
        label: [
          `des stations sans gazole, ${f.date(S.days[d])} (${f.num(S.shortN[d])} stations)`,
          `of stations out of diesel, ${f.date(S.days[d])} (${f.num(S.shortN[d])} stations)`,
        ],
        vs: [
          `sommet : ${f.pct(S.short[dPeak])} le ${f.date(S.days[dPeak], { day: "numeric", month: "short", year: "numeric" })}`,
          `peak: ${f.pct(S.short[dPeak])} on ${f.date(S.days[dPeak], { day: "numeric", month: "short", year: "numeric" })}`,
        ],
      }),
      chart: f => ({
        x: S.days,
        series: [
          { label: f.L(["Gazole", "Diesel"]), values: S.short, emph: true },
        ],
        fmtY: v => f.pct(v, 0),
        fmtV: v => f.pct(v),
        fmtX: (x, short) =>
          short
            ? f.date(x, { month: "short", year: "2-digit" })
            : f.date(x, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
        ticks: dayTicks,
      }),
      map: {
        values: S.shortDep,
        fmt: f => v => f.pct(v, 0),
        caption: f => [
          `Part des stations sans gazole, ${f.date(S.days[d])}`,
          `Share of stations out of diesel, ${f.date(S.days[d])}`,
        ],
        source: SOURCES.pump,
      },
      cant: [
        [
          "Une rupture est déclarée par la station elle-même ; une station qui ne déclare rien n'est pas comptée.",
          "A shortage is declared by the station itself; a station that declares nothing isn't counted.",
        ],
        [
          "Ni la durée de la rupture, ni la longueur des files d'attente.",
          "Neither how long the shortage lasts nor how long the queues are.",
        ],
      ],
      source: SOURCES.pump,
    },
    more.violence,
    more.sexual_violence,
    more.immigration,
    more.removals,
    more.debt,
    more.tax_fairness,
    more.doctors,
    more.mental_health,
    more.heat,
    more.emissions,
    more.industry,
    more.farm_income,
    {
      id: "unemployment",
      topic: "jobs",
      q: ["Le chômage augmente-t-il ?", "Is unemployment rising?"],
      spark: S.unemp.all.slice(-16),
      value: f => f.pct(S.unemp.all[q]),
      headline: f => ({
        label: [
          `de la population active, ${f.quarter(S.quarters[q])}`,
          `of the labour force, ${f.quarter(S.quarters[q])}`,
        ],
        vs: [
          `${f.pct(S.unemp.all[q - 4])} il y a un an · ${f.pct(Math.min(...S.unemp.all.filter(v => v != null)))} au plus bas depuis 2015`,
          `${f.pct(S.unemp.all[q - 4])} a year ago · ${f.pct(Math.min(...S.unemp.all.filter(v => v != null)))} at its lowest since 2015`,
        ],
      }),
      chart: f => ({
        x: S.quarters,
        series: [
          {
            label: f.L(["Tous âges", "All ages"]),
            values: S.unemp.all,
            emph: true,
          },
          { label: "50+", values: S.unemp["50+"] },
        ],
        fmtY: v => f.pct(v, 0),
        fmtV: v => f.pct(v),
        fmtX: (x, short) => (short ? x.slice(0, 4) : f.quarter(x)),
        ticks: quarterTicks,
      }),
      map: {
        values: S.unempDep,
        fmt: f => v => f.pct(v),
        caption: f => [
          `Taux de chômage par département, ${f.quarter(S.quarters[q])}`,
          `Unemployment rate by département, ${f.quarter(S.quarters[q])}`,
        ],
        source: SOURCES.unemp,
      },
      cant: [
        [
          "Le chômage au sens du BIT (Insee) n'est pas le nombre d'inscrits à France Travail : les deux mesures diffèrent.",
          "ILO unemployment (Insee) isn't the number registered with France Travail: the two measures differ.",
        ],
        [
          "Ni le temps partiel subi, ni les personnes qui ont renoncé à chercher.",
          "Neither involuntary part-time work nor people who have given up looking.",
        ],
      ],
      source: SOURCES.unemp,
    },
    {
      id: "youth",
      topic: "jobs",
      q: [
        "Le chômage des jeunes augmente-t-il ?",
        "Is youth unemployment rising?",
      ],
      spark: S.unemp["15-24"].slice(-16),
      value: f => f.pct(S.unemp["15-24"][q]),
      headline: f => ({
        label: [
          `des 15-24 ans actifs, ${f.quarter(S.quarters[q])}`,
          `of economically active 15-24s, ${f.quarter(S.quarters[q])}`,
        ],
        vs: [
          `${f.pct(S.unemp["15-24"][q - 4])} il y a un an · tous âges : ${f.pct(S.unemp.all[q])}`,
          `${f.pct(S.unemp["15-24"][q - 4])} a year ago · all ages: ${f.pct(S.unemp.all[q])}`,
        ],
      }),
      chart: f => ({
        x: S.quarters,
        series: [
          { label: "15-24", values: S.unemp["15-24"], emph: true },
          { label: f.L(["Tous âges", "All ages"]), values: S.unemp.all },
          { label: "50+", values: S.unemp["50+"] },
        ],
        fmtY: v => f.pct(v, 0),
        fmtV: v => f.pct(v),
        fmtX: (x, short) => (short ? x.slice(0, 4) : f.quarter(x)),
        ticks: quarterTicks,
      }),
      map: {
        values: S.unempDep,
        fmt: f => v => f.pct(v),
        caption: f => [
          `Taux de chômage, tous âges, ${f.quarter(S.quarters[q])}`,
          `Unemployment rate, all ages, ${f.quarter(S.quarters[q])}`,
        ],
        source: SOURCES.unemp,
      },
      cant: [
        [
          "Le taux des 15-24 ans ne porte que sur les jeunes actifs : la plupart des 15-24 ans étudient et ne sont pas comptés.",
          "The 15-24 rate only covers young people in the labour force: most 15-24s are studying and aren't counted.",
        ],
        [
          "La carte est tous âges confondus : l'Insee ne publie pas le chômage des jeunes par département chaque trimestre.",
          "The map covers all ages: Insee doesn't publish youth unemployment by département each quarter.",
        ],
      ],
      source: SOURCES.unemp,
    },
    more.pensioners,
    more.fraud,
    more.teachers,
    more.school_spending,
    {
      id: "classes",
      topic: "education",
      q: [
        "Les classes sont-elles plus chargées ?",
        "Are classes getting bigger?",
      ],
      spark: null,
      value: f =>
        f.num(S.school.es.all[S.school.es.all.length - 1], {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      headline: f => {
        const n = S.school.years.length - 1
        const one = v =>
          f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        return {
          label: [
            `élèves par groupe d'enseignement en lycée, rentrée ${S.school.years[n]}`,
            `pupils per teaching group in lycées, ${S.school.years[n]} school year`,
          ],
          vs: [
            `${one(S.school.es.all[0])} à la rentrée ${S.school.years[0]} · général et technologique ${one(S.school.es.lgt[n])}, professionnel ${one(S.school.es.lp[n])}`,
            `${one(S.school.es.all[0])} in ${S.school.years[0]} · general and technological ${one(S.school.es.lgt[n])}, vocational ${one(S.school.es.lp[n])}`,
          ],
        }
      },
      chart: f => ({
        x: S.school.years,
        series: [
          { label: f.L(["Général", "General"]), values: S.school.es.lgt },
          {
            label: f.L(["Tous lycées", "All lycées"]),
            values: S.school.es.all,
            emph: true,
          },
          {
            label: f.L(["Professionnel", "Vocational"]),
            values: S.school.es.lp,
          },
        ],
        fmtY: v => f.num(v, { maximumFractionDigits: 0 }),
        fmtV: v =>
          f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        fmtX: x => x,
        ticks: S.school.years.map((_, i) => i),
        height: 200,
      }),
      map: {
        values: S.school.esDep,
        fmt: f => v =>
          f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        caption: f => [
          `Élèves par groupe d'enseignement en lycée, par département, rentrée ${S.school.years[S.school.years.length - 1]}`,
          `Pupils per teaching group in lycées, by département, ${S.school.years[S.school.years.length - 1]} school year`,
        ],
        source: SOURCES.school,
      },
      cant: [
        [
          "Aucune taille de classe n'est publiée pour les lycées : cette mesure compte aussi les demi-groupes, elle est donc plus basse qu'une taille de classe.",
          "No class size is published for lycées: this measure also counts split groups, so it runs lower than class size.",
        ],
        [
          "Trois rentrées seulement (2023 à 2025) : trop peu pour parler de tendance longue.",
          "Only three school years (2023 to 2025): too few to speak of a long-term trend.",
        ],
      ],
      source: SOURCES.school,
    },
  ]
}
