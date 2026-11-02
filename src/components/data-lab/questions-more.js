// The ten questions answered from the second round of official data
// (scripts/data-lab/export-state.py): security, immigration, public finances,
// industry, pensions, doctors, emissions and school spending. Same shape as
// the entries in questions.js. What the data can't tell is said in `cant`,
// and anything that changes how a curve reads (a break in a series, a change
// in how it is recorded) is also marked on the chart itself.

const last = values => {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] != null) return i
  return -1
}
const sum = values => values.reduce((n, v) => n + (v ?? 0), 0)
// Twelve months up to and including index `end`
const rolling = (values, end) => sum(values.slice(end - 11, end + 1))
const change = (now, before) => (now / before - 1) * 100

const everyYears = (labels, k, start = "") =>
  labels
    .map((l, i) => [l, i])
    .filter(([l]) => +l.slice(0, 4) % k === 0 && l.slice(4) === start)
    .map(([, i]) => i)

const signed = (f, v, d = 1) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${f.pct(Math.abs(v), d)}`
const whole = f => v => f.num(Math.round(v))
const oneDecimal = f => v =>
  f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const euros = f => v =>
  v == null ? "—" : f.lang === "fr" ? `${whole(f)(v)} €` : `€${whole(f)(v)}`
const dollars = f => v =>
  v == null ? "—" : f.lang === "fr" ? `${whole(f)(v)} $` : `$${whole(f)(v)}`

const NAMES = {
  FR: ["France", "France"],
  FRA: ["France", "France"],
  DE: ["Allemagne", "Germany"],
  DEU: ["Allemagne", "Germany"],
  IT: ["Italie", "Italy"],
  ITA: ["Italie", "Italy"],
  ES: ["Espagne", "Spain"],
  ESP: ["Espagne", "Spain"],
  BE: ["Belgique", "Belgium"],
  BEL: ["Belgique", "Belgium"],
  NL: ["Pays-Bas", "Netherlands"],
  NLD: ["Pays-Bas", "Netherlands"],
  GBR: ["Royaume-Uni", "United Kingdom"],
  EA21: ["Zone euro", "Euro area"],
  EU27_2020: ["Union européenne", "European Union"],
  OECD: ["Moyenne OCDE", "OECD average"],
}
const AGGREGATES = ["EA21", "EU27_2020", "OECD"]
const rowsOf = (f, list, note) =>
  list.map(([key, value, status]) => ({
    key,
    label: f.L(NAMES[key]),
    value,
    emph: key === "FR" || key === "FRA",
    aggregate: AGGREGATES.includes(key),
    note: note?.(status),
  }))

const monthX = f => (x, short) => (short ? x.slice(0, 4) : f.month(x))
const quarterX = f => (x, short) => (short ? x.slice(0, 4) : f.quarter(x))

export const buildMore = S => {
  /* ---------- security ---------- */
  const C = S.crime
  const cm = C.months
  const cn = last(C.monthly.sexual)
  const phys = C.monthly.physOut.map((v, i) =>
    v == null || C.monthly.physIn[i] == null ? null : v + C.monthly.physIn[i],
  )
  const cy = C.years.length - 1
  const june = cm.indexOf("2026-06")
  const recorded = [
    "Enregistré ne veut pas dire commis : ces chiffres comptent les victimes connues de la police et de la gendarmerie, le plus souvent parce qu'elles ont porté plainte. Davantage de plaintes font monter la courbe sans qu'il y ait forcément davantage de violences.",
    "Recorded doesn't mean committed: these figures count the victims known to the police and gendarmerie, mostly because they filed a complaint. More complaints push the curve up without there necessarily being more violence.",
  ]
  const crimeSource = {
    producer:
      "SSMSI · ministère de l'Intérieur (délinquance enregistrée par la police et la gendarmerie)",
    cadence: [
      "Mensuelle (France), annuelle (départements)",
      "Monthly (France), yearly (départements)",
    ],
    latest: f => f.month(cm[cn]),
    next: ["≈ mi-novembre (octobre)", "≈ mid-November (October)"],
    type: "official",
  }
  const crimeChart = {
    caption: [
      "Victimes enregistrées chaque mois, données corrigées des variations saisonnières",
      "Victims recorded each month, seasonally adjusted",
    ],
    ticks: everyYears(cm, 2, "-01"),
  }
  const rateFmt = f => v =>
    `${f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ‰`

  const violence = {
    id: "violence",
    topic: "security",
    q: [
      "Les violences contre les personnes augmentent-elles ?",
      "Is violence against people rising?",
    ],
    spark: phys.slice(-37),
    value: f => whole(f)(rolling(phys, cn)),
    headline: f => ({
      label: [
        `victimes de violences physiques enregistrées sur douze mois, à fin ${f.month(cm[cn])}`,
        `victims of physical violence recorded over twelve months, to ${f.month(cm[cn])}`,
      ],
      vs: [
        `${signed(f, change(rolling(phys, cn), rolling(phys, cn - 12)))} sur un an · ${whole(f)(C.annual.physOut[0] + C.annual.physIn[0])} en ${C.years[0]}`,
        `${signed(f, change(rolling(phys, cn), rolling(phys, cn - 12)))} on a year · ${whole(f)(C.annual.physOut[0] + C.annual.physIn[0])} in ${C.years[0]}`,
      ],
    }),
    chart: f => ({
      ...crimeChart,
      x: cm,
      series: [
        {
          label: f.L(["Hors famille", "Outside family"]),
          values: C.monthly.physOut,
          emph: true,
        },
        {
          label: f.L(["Famille", "Family"]),
          values: C.monthly.physIn,
        },
      ],
      fmtY: whole(f),
      fmtX: monthX(f),
    }),
    tiles: [
      {
        label: [`Homicides, ${C.years[cy]}`, `Homicides, ${C.years[cy]}`],
        value: C.annual.homicide[cy],
        series: C.annual.homicide,
        fmt: whole,
      },
      {
        label: [
          `Tentatives d'homicide, ${C.years[cy]}`,
          `Attempted homicides, ${C.years[cy]}`,
        ],
        value: C.annual.attempt[cy],
        series: C.annual.attempt,
        fmt: whole,
      },
    ],
    map: {
      values: C.dep.physOut,
      fmt: rateFmt,
      caption: () => [
        `Victimes de violences physiques hors de la famille pour 1 000 habitants, ${C.years[cy]}`,
        `Victims of physical violence outside the family per 1,000 inhabitants, ${C.years[cy]}`,
      ],
    },
    cant: [
      recorded,
      [
        "La forte hausse des violences dans la famille tient en partie à des victimes qui portent davantage plainte, en particulier depuis le Grenelle des violences conjugales de 2019.",
        "The sharp rise in violence within families partly reflects victims filing complaints more often, especially since the 2019 national consultation on domestic violence (Grenelle).",
      ],
      [
        "Les homicides sont comptés à l'année : la série mensuelle publiée, non corrigée, ne retombe pas sur le total annuel, nous ne l'utilisons donc pas.",
        "Homicides are counted by year: the published monthly series, unadjusted, doesn't add up to the annual total, so we don't use it.",
      ],
      [
        "Les taux de 2024 et 2025 sont calculés sur la population de 2023, et ceux de Mayotte sur celle de 2017 : le taux de Mayotte, le plus élevé, est sans doute surestimé.",
        "The 2024 and 2025 rates use the 2023 population, and Mayotte's use its 2017 population: Mayotte's rate, the highest, is probably overstated.",
      ],
      [
        "L'enquête de victimation, qui compte aussi les violences jamais déclarées, n'est pas publiée en données ouvertes à ce jour.",
        "The victimisation survey, which also counts violence never reported, isn't published as open data so far.",
      ],
    ],
    source: crimeSource,
  }

  const sexualViolence = {
    id: "sexual_violence",
    topic: "security",
    q: [
      "Les violences sexuelles et conjugales augmentent-elles ?",
      "Is sexual and domestic violence rising?",
    ],
    spark: C.monthly.sexual.slice(-37),
    value: f => whole(f)(rolling(C.monthly.sexual, cn)),
    headline: f => ({
      label: [
        `victimes de violences sexuelles enregistrées sur douze mois, à fin ${f.month(cm[cn])}`,
        `victims of sexual violence recorded over twelve months, to ${f.month(cm[cn])}`,
      ],
      vs: [
        `${signed(f, change(rolling(C.monthly.sexual, cn), rolling(C.monthly.sexual, cn - 12)))} sur un an, hausse gonflée par un rattrapage d'enregistrement en juin 2026 · ${whole(f)(C.annual.sexual[0])} en ${C.years[0]}`,
        `${signed(f, change(rolling(C.monthly.sexual, cn), rolling(C.monthly.sexual, cn - 12)))} on a year, inflated by a recording catch-up in June 2026 · ${whole(f)(C.annual.sexual[0])} in ${C.years[0]}`,
      ],
    }),
    chart: f => ({
      ...crimeChart,
      x: cm,
      series: [
        {
          label: f.L(["Violences sexuelles", "Sexual violence"]),
          values: C.monthly.sexual,
          emph: true,
        },
      ],
      marks:
        june < 0
          ? []
          : [
              {
                at: june,
                label: f.L([
                  "Juin 2026 : intégration d'un stock de procédures sur mineurs",
                  "June 2026: a backlog of cases on minors is recorded",
                ]),
              },
            ],
      fmtY: whole(f),
      fmtX: monthX(f),
    }),
    tiles: [
      {
        label: [
          `Violences physiques conjugales, ${C.years[cy]}`,
          `Physical violence by a partner, ${C.years[cy]}`,
        ],
        value: C.annual.conjugal[cy],
        series: C.annual.conjugal,
        fmt: whole,
      },
      {
        label: [
          `Violences physiques dans la famille, hors couple, ${C.years[cy]}`,
          `Physical violence within the family, outside couples, ${C.years[cy]}`,
        ],
        value: C.annual.nonConjugal[cy],
        series: C.annual.nonConjugal,
        fmt: whole,
      },
    ],
    map: {
      values: C.dep.sexual,
      fmt: rateFmt,
      caption: () => [
        `Victimes de violences sexuelles pour 1 000 habitants, ${C.years[cy]}`,
        `Victims of sexual violence per 1,000 inhabitants, ${C.years[cy]}`,
      ],
    },
    cant: [
      [
        "En juin 2026, les violences sexuelles enregistrées bondissent (+76 % sur mai) : police et gendarmerie ont intégré d'un coup un stock de procédures pour violences sexuelles sur mineurs qui attendaient d'être qualifiées. Le SSMSI parle d'un effet statistique ; il explique plus de la moitié de la hausse sur douze mois à fin juin.",
        "In June 2026 recorded sexual violence jumps (+76% on May): the police and gendarmerie added at once a backlog of cases of sexual violence against minors that were awaiting classification. The SSMSI calls it a statistical effect; it accounts for more than half of the twelve-month rise to the end of June.",
      ],
      [
        "Enregistré ne veut pas dire commis. Depuis #MeToo (2017) et le Grenelle des violences conjugales (2019), les victimes portent davantage plainte : une hausse des chiffres peut refléter une parole plus libre autant qu'une hausse des faits.",
        "Recorded doesn't mean committed. Since #MeToo (2017) and the 2019 national consultation on domestic violence, victims file complaints more often: rising figures can reflect people speaking up as much as more offences.",
      ],
      [
        "Une partie des violences sexuelles est enregistrée des années après les faits.",
        "Some sexual violence is recorded years after it happened.",
      ],
      [
        "La série complète des violences conjugales (physiques, sexuelles, verbales) s'arrête en 2022 ; depuis, seules les violences physiques conjugales sont publiées chaque année.",
        "The full series on partner violence (physical, sexual, verbal) stops in 2022; since then only physical violence by a partner is published each year.",
      ],
    ],
    source: crimeSource,
  }

  /* ---------- immigration ---------- */
  const M = S.migration
  const my = last(M.permits.total)
  const am = M.asylumM.length - 1
  const imm = M.immigrants
  const im = imm.years.length - 1
  const y2012 = M.years.indexOf("2012")

  const immigration = {
    id: "immigration",
    topic: "immigration",
    q: ["L'immigration augmente-t-elle ?", "Is immigration increasing?"],
    spark: M.permits.total,
    value: f => whole(f)(M.permits.total[my]),
    headline: f => ({
      label: [
        `premiers titres de séjour délivrés en ${M.years[my]} (provisoire)`,
        `first residence permits issued in ${M.years[my]} (provisional)`,
      ],
      vs: [
        `${whole(f)(M.permits.total[my - 1])} en ${M.years[my - 1]} · ${whole(f)(M.permits.total[y2012])} en 2012`,
        `${whole(f)(M.permits.total[my - 1])} in ${M.years[my - 1]} · ${whole(f)(M.permits.total[y2012])} in 2012`,
      ],
    }),
    chart: f => ({
      caption: [
        "Premiers titres de séjour par motif, chaque année",
        "First residence permits by reason, each year",
      ],
      x: M.years,
      series: [
        { label: f.L(["Total", "Total"]), values: M.permits.total, emph: true },
        { label: f.L(["Études", "Study"]), values: M.permits.education },
        { label: f.L(["Famille", "Family"]), values: M.permits.family },
        {
          label: f.L(["Autres", "Other"]),
          values: M.permits.other,
        },
        { label: f.L(["Travail", "Work"]), values: M.permits.employment },
      ],
      fmtY: whole(f),
      fmtX: x => x,
      ticks: everyYears(M.years, 2),
    }),
    compare: f => ({
      caption: [
        `Premiers titres de séjour pour 1 000 habitants, ${M.years[my]}`,
        `First residence permits per 1,000 inhabitants, ${M.years[my]}`,
      ],
      rows: rowsOf(
        f,
        [...M.perK]
          .sort((a, b) => b[1] - a[1])
          .map(([g, permits]) => [g, permits]),
      ),
      fmt: oneDecimal(f),
    }),
    tiles: [
      {
        label: [
          `Premières demandes d'asile, ${M.years[my]}`,
          `First-time asylum applicants, ${M.years[my]}`,
        ],
        value: M.asylum[my],
        series: M.asylum,
        fmt: whole,
      },
      {
        label: [
          "Premières demandes d'asile, douze derniers mois",
          "First-time asylum applicants, last twelve months",
        ],
        value: rolling(M.asylumM, am),
        series: M.asylumM.slice(-36),
        fmt: whole,
      },
      {
        label: [
          `Part des immigrés dans la population, ${imm.years[im]}`,
          `Immigrants' share of the population, ${imm.years[im]}`,
        ],
        value: imm.share[im],
        series: imm.share,
        fmt: f => v => f.pct(v),
      },
    ],
    cant: [
      [
        "Un premier titre de séjour n'est pas une arrivée : il compte aussi des personnes déjà en France qui changent de statut, et ne compte pas les citoyens européens, qui n'en ont pas besoin.",
        "A first residence permit isn't an arrival: it also counts people already in France who change status, and doesn't count EU citizens, who don't need one.",
      ],
      [
        "« Autres » comprend notamment les titres de protection accordés aux réfugiés.",
        "“Other” includes in particular the protection permits granted to refugees.",
      ],
      [
        "2021 est gonflée par les titres délivrés aux Britanniques après le Brexit.",
        "2021 is inflated by the permits issued to British citizens after Brexit.",
      ],
      [
        "Les chiffres de l'année la plus récente sont provisoires et sont d'ordinaire révisés à la hausse.",
        "The latest year's figures are provisional and are usually revised upwards.",
      ],
      [
        "La part des immigrés marque une rupture en 2024 : la nouvelle collecte du recensement, par smartphone, compte environ 242 000 immigrés de plus par simple effet de mesure. Les années avant 2024 ne se comparent pas directement aux suivantes.",
        "The immigrants' share breaks in 2024: the census's new smartphone collection counts about 242,000 more immigrants through a measurement effect alone. Years before 2024 don't compare directly with later ones.",
      ],
    ],
    source: {
      producer:
        "Eurostat · premiers titres de séjour et demandes d'asile ; Insee · population immigrée",
      cadence: [
        "Annuelle (titres), mensuelle (asile)",
        "Yearly (permits), monthly (asylum)",
      ],
      latest: f => `${M.years[my]} · ${f.month(M.asylumMonths[am])}`,
      next: [
        "chaque mois (asile), chaque automne (titres)",
        "monthly (asylum), each autumn (permits)",
      ],
      note: [
        "Les chiffres Insee de 2025 sont repris des tableaux de sa page : le fichier téléchargeable n'avait pas encore été mis à jour.",
        "Insee's 2025 figures are taken from the tables on its page: the downloadable file had not yet been updated.",
      ],
      type: "official",
    },
  }

  const mq = M.quarters.length - 1
  const removals = {
    id: "removals",
    topic: "immigration",
    q: [
      "Les expulsions d'étrangers en situation irrégulière augmentent-elles ?",
      "Are removals of irregular migrants rising?",
    ],
    spark: M.returned,
    value: f => whole(f)(M.returned[my]),
    headline: f => ({
      label: [
        `étrangers en situation irrégulière effectivement partis en ${M.years[my]}, après une obligation de quitter le territoire`,
        `irregular migrants who actually left in ${M.years[my]} after an order to leave`,
      ],
      vs: [
        `pour ${whole(f)(M.ordered[my])} obligations prononcées · ${whole(f)(M.returned[y2012])} départs pour ${whole(f)(M.ordered[y2012])} obligations en 2012`,
        `against ${whole(f)(M.ordered[my])} orders issued · ${whole(f)(M.returned[y2012])} departures against ${whole(f)(M.ordered[y2012])} orders in 2012`,
      ],
    }),
    chart: f => ({
      caption: [
        "Obligations de quitter le territoire prononcées et départs effectifs, chaque année",
        "Orders to leave issued and actual departures, each year",
      ],
      x: M.years,
      series: [
        {
          label: f.L(["Obligations", "Orders"]),
          values: M.ordered,
        },
        {
          label: f.L(["Départs", "Departures"]),
          values: M.returned,
          emph: true,
        },
      ],
      fmtY: whole(f),
      fmtX: x => x,
      ticks: everyYears(M.years, 2),
    }),
    tiles: [
      ["forced", ["Retours forcés", "Forced returns"]],
      [
        "assisted_voluntary",
        ["Retours volontaires aidés", "Assisted voluntary returns"],
      ],
      [
        "non_assisted_voluntary",
        ["Retours volontaires sans aide", "Voluntary returns without aid"],
      ],
    ].map(([key, label]) => ({
      label: [
        `${label[0]}, ${M.quarters[mq].replace("-Q", " T")}`,
        `${label[1]}, ${M.quarters[mq].replace("-Q", " Q")}`,
      ],
      value: M.returnedQ[key][mq],
      series: M.returnedQ[key],
      fmt: whole,
    })),
    cant: [
      [
        "Obligations et départs d'une même année ne concernent pas les mêmes personnes : un départ en 2025 peut suivre une obligation de 2023. Le rapport entre les deux n'est qu'un ordre de grandeur.",
        "Orders and departures in the same year don't concern the same people: a departure in 2025 may follow an order from 2023. The ratio between the two is only an order of magnitude.",
      ],
      [
        "Eurostat ne compte que les ressortissants de pays hors de l'Union ; le ministère de l'Intérieur, qui compte aussi les Européens, publie des chiffres un peu différents.",
        "Eurostat counts only nationals of non-EU countries; the Interior ministry, which also counts Europeans, publishes slightly different figures.",
      ],
      [
        "La France prononce bien plus d'obligations de quitter le territoire que ses voisins : comparer les taux d'exécution entre pays induit en erreur.",
        "France issues far more orders to leave than its neighbours: comparing execution rates between countries is misleading.",
      ],
      [
        "La série française des départs change de méthode en 2021.",
        "The French series of departures changes method in 2021.",
      ],
    ],
    source: {
      producer: "Eurostat · application de la législation sur l'immigration",
      cadence: ["Annuelle et trimestrielle", "Yearly and quarterly"],
      latest: f => f.quarter(M.quarters[mq]),
      next: [
        "≈ trois mois après la fin du trimestre",
        "≈ three months after the quarter ends",
      ],
      type: "official",
    },
  }

  /* ---------- public finances ---------- */
  const D = S.debt
  const dq = D.quarters.length - 1
  const dAt = q => D.pct[D.quarters.indexOf(q)]
  const debt = {
    id: "debt",
    topic: "public",
    q: [
      "La dette publique continue-t-elle de grimper ?",
      "Is public debt still climbing?",
    ],
    spark: D.pct.slice(-37),
    value: f => f.pct(D.pct[dq]),
    headline: f => ({
      label: [
        `du PIB : la dette publique, ${f.quarter(D.quarters[dq])}`,
        `of GDP: public debt in ${f.quarter(D.quarters[dq])}`,
      ],
      vs: [
        `${f.num(D.eur[dq], { maximumFractionDigits: 0 })} milliards d'euros · fin 2019 : ${f.pct(dAt("2019-Q4"))} · fin 2007 : ${f.pct(dAt("2007-Q4"))}`,
        `€${f.num(D.eur[dq], { maximumFractionDigits: 0 })} billion · end 2019: ${f.pct(dAt("2019-Q4"))} · end 2007: ${f.pct(dAt("2007-Q4"))}`,
      ],
    }),
    chart: f => ({
      caption: [
        "Dette publique au sens de Maastricht, en % du PIB, chaque trimestre",
        "Public debt (Maastricht definition), % of GDP, each quarter",
      ],
      x: D.quarters,
      series: [
        { label: "France", values: D.pct, emph: true },
        { label: f.L(NAMES.IT), values: D.eu.IT },
        { label: f.L(NAMES.EA21), values: D.eu.EA21 },
        { label: f.L(NAMES.DE), values: D.eu.DE },
      ],
      fmtY: v => f.pct(v, 0),
      fmtX: quarterX(f),
      ticks: everyYears(D.quarters, 5, "-Q1"),
    }),
    compare: f => ({
      caption: [
        `Dette publique en % du PIB, ${f.quarter(D.euQuarter)}`,
        `Public debt as % of GDP, ${f.quarter(D.euQuarter)}`,
      ],
      rows: rowsOf(f, D.euRows),
      fmt: v => f.pct(v),
    }),
    cant: [
      [
        "En euros, la dette bat des records presque chaque trimestre, ne serait-ce qu'avec l'inflation : c'est son poids par rapport au PIB qui dit si elle grimpe vraiment.",
        "In euros, debt sets records almost every quarter, if only through inflation: its weight against GDP is what shows whether it is really climbing.",
      ],
      [
        "Insee et Eurostat diffèrent parfois d'un dixième de point, selon la version du PIB utilisée : la France est ici à la fois à " +
          `${D.pct[dq].toFixed(1).replace(".", ",")} % (Insee) et ${D.euRows
            .find(r => r[0] === "FR")[1]
            .toFixed(1)
            .replace(".", ",")} % (Eurostat).`,
        "Insee and Eurostat sometimes differ by a tenth of a point, depending on the GDP vintage used: France shows here as both " +
          `${D.pct[dq].toFixed(1)}% (Insee) and ${D.euRows.find(r => r[0] === "FR")[1].toFixed(1)}% (Eurostat).`,
      ],
      [
        "Le niveau de la dette ne dit ni qui la détient, ni ce qu'elle coûte en intérêts.",
        "The level of debt says neither who holds it nor what it costs in interest.",
      ],
      [
        "La zone euro est comptée dans sa composition de 2026 (21 pays, avec la Bulgarie), sur toute la période.",
        "The euro area is counted in its 2026 composition (21 countries, with Bulgaria) over the whole period.",
      ],
    ],
    source: {
      producer:
        "Insee · dette trimestrielle des administrations publiques ; Eurostat (voisins)",
      cadence: ["Trimestrielle", "Quarterly"],
      latest: f => f.quarter(D.quarters[dq]),
      next: ["fin décembre (T3)", "late December (Q3)"],
      type: "official",
    },
  }

  /* ---------- economy ---------- */
  const I = S.industry
  const iq = I.quarters.length - 1
  const iAt = q => I.industry[I.quarters.indexOf(q)]
  const iPeak = I.industry.indexOf(Math.max(...I.industry))
  const jobs = f => v => whole(f)(v * 1000)
  const industry = {
    id: "industry",
    topic: "economy",
    q: [
      "La France perd-elle des emplois industriels ?",
      "Is France losing industrial jobs?",
    ],
    spark: I.industry.slice(-37),
    value: f => jobs(f)(I.industry[iq]),
    headline: f => ({
      label: [
        `emplois salariés dans l'industrie, ${f.quarter(I.quarters[iq])}`,
        `salaried jobs in industry, ${f.quarter(I.quarters[iq])}`,
      ],
      vs: [
        `un an plus tôt : ${jobs(f)(I.industry[iq - 4])} · fin 2019 : ${jobs(f)(iAt("2019-Q4"))} · record en ${I.quarters[iPeak].slice(0, 4)} : ${jobs(f)(I.industry[iPeak])}`,
        `a year earlier: ${jobs(f)(I.industry[iq - 4])} · end 2019: ${jobs(f)(iAt("2019-Q4"))} · peak in ${I.quarters[iPeak].slice(0, 4)}: ${jobs(f)(I.industry[iPeak])}`,
      ],
    }),
    chart: f => ({
      caption: [
        "Emplois salariés, données corrigées des variations saisonnières, chaque trimestre",
        "Salaried jobs, seasonally adjusted, each quarter",
      ],
      x: I.quarters,
      series: [
        {
          label: f.L(["Industrie", "Industry"]),
          values: I.industry,
          emph: true,
        },
        {
          label: f.L(["Manufacture", "Manufacturing"]),
          values: I.manufacturing,
        },
      ],
      fmtY: v => `${f.num(v / 1000, { maximumFractionDigits: 1 })} M`,
      fmtV: jobs(f),
      fmtX: quarterX(f),
      ticks: everyYears(I.quarters, 10, "-Q1"),
    }),
    map: {
      values: I.dep,
      fmt: f => v => signed(f, v),
      caption: f => [
        `Évolution de l'emploi industriel de fin 2019 au ${f.quarter(I.quarters[iq])}`,
        `Change in industrial jobs from end 2019 to ${f.quarter(I.quarters[iq])}`,
      ],
    },
    cant: [
      [
        "Seuls les salariés sont comptés, et les intérimaires qui travaillent en usine sont classés dans les services : un recours accru à l'intérim fait baisser l'emploi industriel affiché.",
        "Only employees are counted, and temps working in factories are classed under services: more use of temp work lowers the industrial jobs shown.",
      ],
      [
        "Les emplois sont comptés là où se trouve l'établissement, pas là où vivent les salariés.",
        "Jobs are counted where the establishment is, not where the employees live.",
      ],
      [
        "Dans les petits départements, quelques centaines d'emplois font beaucoup varier les pourcentages. Mayotte n'est pas couverte.",
        "In small départements a few hundred jobs swing the percentages a lot. Mayotte isn't covered.",
      ],
    ],
    source: {
      producer: "Insee · estimations d'emploi salarié",
      cadence: ["Trimestrielle", "Quarterly"],
      latest: f => f.quarter(I.quarters[iq]),
      next: ["début décembre (T3)", "early December (Q3)"],
      type: "official",
    },
  }

  /* ---------- pensions ---------- */
  const Lv = S.living
  const ly = Lv.years.length - 1
  const pensioners = {
    id: "pensioners",
    topic: "social",
    q: [
      "Les retraités vivent-ils mieux que les actifs ?",
      "Are pensioners better off than workers?",
    ],
    spark: Lv.retired,
    value: f => euros(f)(Lv.retired[ly]),
    headline: f => ({
      label: [
        `niveau de vie médian des retraités, ${Lv.years[ly]}, par an`,
        `median standard of living of pensioners, ${Lv.years[ly]}, per year`,
      ],
      vs: [
        `personnes en emploi : ${euros(f)(Lv.employed[ly])} · ensemble de la population : ${euros(f)(Lv.all[ly])} · chômeurs : ${euros(f)(Lv.unemployed[ly])}`,
        `people in work: ${euros(f)(Lv.employed[ly])} · whole population: ${euros(f)(Lv.all[ly])} · unemployed: ${euros(f)(Lv.unemployed[ly])}`,
      ],
    }),
    chart: f => ({
      caption: [
        `Niveau de vie médian, en euros de ${Lv.years[ly]}`,
        `Median standard of living, in ${Lv.years[ly]} euros`,
      ],
      x: Lv.years,
      series: [
        { label: f.L(["En emploi", "In work"]), values: Lv.employed },
        {
          label: f.L(["Retraités", "Pensioners"]),
          values: Lv.retired,
          emph: true,
        },
        { label: f.L(["Ensemble", "Everyone"]), values: Lv.all },
        { label: f.L(["Chômeurs", "Unemployed"]), values: Lv.unemployed },
      ],
      marks: Lv.breaks.map((y, k) => ({
        at: Lv.years.indexOf(y),
        label: k
          ? null
          : f.L([
              `Changements de méthode : ${Lv.breaks.join(", ")}`,
              `Method changes: ${Lv.breaks.join(", ")}`,
            ]),
      })),
      fmtY: v =>
        f.num(v / 1000, { maximumFractionDigits: 0 }) +
        (f.lang === "fr" ? " k€" : "k"),
      fmtV: euros(f),
      fmtX: x => x,
      ticks: everyYears(Lv.years, 4),
    }),
    cant: [
      [
        `Insee a changé de méthode en ${Lv.breaks.join(", ")} : les sauts d'une année à l'autre à ces dates (traits pointillés) ne sont pas des évolutions réelles.`,
        `Insee changed method in ${Lv.breaks.join(", ")}: year-to-year jumps at those dates (dashed lines) aren't real changes.`,
      ],
      [
        "Le niveau de vie divise le revenu du ménage selon sa taille : des retraités vivant à deux, sans enfant à charge, s'en trouvent avantagés à pension égale.",
        "Standard of living divides household income by household size: pensioners living as a couple with no dependent children come out ahead for the same pension.",
      ],
      [
        "Le logement dont on est propriétaire n'est pas compté comme un revenu, alors que les retraités sont plus souvent propriétaires.",
        "Owning one's home isn't counted as income, though pensioners are more often homeowners.",
      ],
      [
        "France métropolitaine, hors personnes vivant en établissement (Ehpad notamment). Une médiane cache aussi de grands écarts entre retraités.",
        "Metropolitan France, excluding people living in institutions (care homes in particular). A median also hides wide gaps between pensioners.",
      ],
    ],
    source: {
      producer:
        "Insee · enquête Revenus fiscaux et sociaux (niveau de vie selon le statut d'activité)",
      cadence: ["Annuelle", "Yearly"],
      latest: () => Lv.years[ly],
      next: ["juillet 2027 (revenus 2025)", "July 2027 (2025 incomes)"],
      type: "official",
    },
  }

  /* ---------- health ---------- */
  const O = S.doctors
  const oy = O.years.length - 1
  const ay = O.aplYears.length - 1
  const doctors = {
    id: "doctors",
    topic: "health",
    q: ["Manque-t-on de médecins ?", "Is France short of doctors?"],
    spark: O.gp,
    value: f => oneDecimal(f)(O.gp[oy]),
    headline: f => ({
      label: [
        `médecins généralistes pour 100 000 habitants, ${O.years[oy]}`,
        `general practitioners per 100,000 inhabitants, ${O.years[oy]}`,
      ],
      vs: [
        `${oneDecimal(f)(O.gp[0])} en ${O.years[0]} · en libéral ou mixte : ${oneDecimal(f)(O.gpPrivate[oy])} · tous médecins confondus : ${oneDecimal(f)(O.all[oy])}`,
        `${oneDecimal(f)(O.gp[0])} in ${O.years[0]} · in private or mixed practice: ${oneDecimal(f)(O.gpPrivate[oy])} · all doctors: ${oneDecimal(f)(O.all[oy])}`,
      ],
    }),
    chart: f => ({
      caption: [
        "Généralistes pour 100 000 habitants au 1er janvier : tous, et en libéral ou mixte",
        "GPs per 100,000 inhabitants on 1 January: all, and in private or mixed practice",
      ],
      x: O.years,
      series: [
        {
          label: f.L(["Généralistes", "All GPs"]),
          values: O.gp,
          emph: true,
        },
        {
          label: f.L(["Libéraux", "Private"]),
          values: O.gpPrivate,
        },
      ],
      fmtY: whole(f),
      fmtV: oneDecimal(f),
      fmtX: x => x,
      ticks: everyYears(O.years, 2),
    }),
    tiles: [
      {
        label: [
          `Habitants d'une commune sous-dotée en généralistes, ${O.aplYears[ay]}`,
          `People living in a commune short of GPs, ${O.aplYears[ay]}`,
        ],
        value: O.aplUnder[ay],
        series: O.aplUnder,
      },
      {
        label: [
          `Même mesure, en ne comptant que les généralistes de 65 ans ou moins, ${O.aplYears[ay]}`,
          `Same measure, counting only GPs aged 65 or under, ${O.aplYears[ay]}`,
        ],
        value: O.aplUnder65[ay],
        series: O.aplUnder65,
      },
    ],
    map: {
      values: O.dep,
      fmt: f => whole(f),
      caption: () => [
        `Généralistes pour 100 000 habitants, ${O.years[oy]}`,
        `GPs per 100,000 inhabitants, ${O.years[oy]}`,
      ],
    },
    cant: [
      [
        "La densité compte tous les généralistes inscrits, y compris des salariés qui ne reçoivent pas de patients en cabinet ; les libéraux et mixtes donnent une image plus proche des soins de ville.",
        "Density counts every registered GP, including salaried ones who don't see patients in a practice; private and mixed practice gives a picture closer to community care.",
      ],
      [
        "« Sous-dotée » suit le seuil de la DREES : moins de 2,5 consultations de généraliste accessibles par habitant et par an (l'indicateur APL), calculé ici commune par commune.",
        "“Short of GPs” follows the DREES threshold: fewer than 2.5 accessible GP consultations per inhabitant per year (the APL indicator), computed here commune by commune.",
      ],
      [
        `Les Hautes-Alpes affichent une densité atypique (${O.dep["05"]} pour 100 000) : nous la signalons sans pouvoir l'expliquer à partir de ces données.`,
        `Hautes-Alpes shows an unusual density (${O.dep["05"]} per 100,000): we flag it without being able to explain it from this data.`,
      ],
      [
        "L'accessibilité (APL) n'est disponible que de 2022 à 2024 dans sa méthode actuelle ; les chiffres plus anciens ne se comparent pas.",
        "Accessibility (APL) is only available from 2022 to 2024 under its current method; older figures don't compare.",
      ],
    ],
    source: {
      producer:
        "DREES · démographie des professionnels de santé (RPPS) et accessibilité potentielle localisée (APL)",
      cadence: ["Annuelle", "Yearly"],
      latest: () => `${O.years[oy]} · APL ${O.aplYears[ay]}`,
      next: ["juillet 2027", "July 2027"],
      type: "official",
    },
  }

  /* ---------- environment ---------- */
  const E = S.emissions
  const ey = E.years.length - 1
  const mt = f => v =>
    `${f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mt`
  const emissions = {
    id: "emissions",
    topic: "environment",
    q: [
      "Les émissions de gaz à effet de serre de la France baissent-elles ?",
      "Are France's greenhouse gas emissions falling?",
    ],
    spark: E.total_excl_lulucf,
    value: f => mt(f)(E.total_excl_lulucf[ey]),
    headline: f => ({
      label: [
        `de gaz à effet de serre émis en France en ${E.years[ey]} (estimation provisoire), en équivalent CO₂`,
        `of greenhouse gases emitted in France in ${E.years[ey]} (provisional estimate), CO₂ equivalent`,
      ],
      vs: [
        `${signed(f, change(E.total_excl_lulucf[ey], E.total_excl_lulucf[0]))} depuis ${E.years[0]} · premier semestre ${E.h1[0]} : ${signed(f, change(E.h1[2], E.h1[1]))} sur un an`,
        `${signed(f, change(E.total_excl_lulucf[ey], E.total_excl_lulucf[0]))} since ${E.years[0]} · first half of ${E.h1[0]}: ${signed(f, change(E.h1[2], E.h1[1]))} on a year`,
      ],
    }),
    chart: f => ({
      caption: [
        "Millions de tonnes équivalent CO₂ par an, par secteur",
        "Million tonnes CO₂ equivalent per year, by sector",
      ],
      x: E.years,
      series: [
        {
          label: f.L(["Total", "Total"]),
          values: E.total_excl_lulucf,
          emph: true,
        },
        { label: f.L(["Transports", "Transport"]), values: E.transport },
        { label: f.L(["Agriculture", "Agriculture"]), values: E.agriculture },
        {
          label: f.L(["Industrie", "Industry"]),
          values: E.manufacturing_construction,
        },
        { label: f.L(["Bâtiments", "Buildings"]), values: E.buildings },
        { label: f.L(["Énergie", "Energy"]), values: E.energy_industry },
      ],
      fmtY: whole(f),
      fmtV: v => f.num(v, { maximumFractionDigits: 0 }),
      fmtX: x => x,
      ticks: everyYears(E.years, 5),
    }),
    compare: f => ({
      caption: [
        `Évolution des émissions de 1990 à ${E.euYear}`,
        `Change in emissions from 1990 to ${E.euYear}`,
      ],
      rows: rowsOf(f, E.euRows),
      fmt: v => signed(f, v),
    }),
    cant: [
      [
        `Le chiffre de ${E.years[ey]} est une estimation provisoire, et chaque édition du Citepa révise toute la série.`,
        `The ${E.years[ey]} figure is a provisional estimate, and each Citepa edition revises the whole series.`,
      ],
      [
        "Ce sont les émissions produites sur le territoire : ni le transport aérien et maritime international, ni les émissions des biens importés (l'empreinte carbone) ne sont comptés.",
        "These are emissions produced on French territory: neither international aviation and shipping nor the emissions of imported goods (the carbon footprint) are counted.",
      ],
      [
        "Le carbone absorbé par les forêts et les sols est exclu du total.",
        "Carbon absorbed by forests and soils is excluded from the total.",
      ],
      [
        "Le chiffre du semestre vient du baromètre mensuel du Citepa, une estimation plus fragile que l'inventaire annuel.",
        "The half-year figure comes from Citepa's monthly barometer, a rougher estimate than the annual inventory.",
      ],
    ],
    source: {
      producer:
        "Citepa · inventaire Secten (édition juin 2026) et baromètre mensuel ; Eurostat (voisins)",
      cadence: [
        "Annuelle, avec un baromètre mensuel",
        "Yearly, with a monthly barometer",
      ],
      latest: () => `${E.years[ey]} · ${E.h1[0]}`,
      next: ["juin 2027", "June 2027"],
      type: "official",
    },
  }

  /* ---------- education ---------- */
  const P = S.spending
  const py = P.years.length - 1
  const fra = P.rows.find(r => r[0] === "FRA")[1]
  const oecd = P.rows.find(r => r[0] === "OECD")[1]
  const deu = P.rows.find(r => r[0] === "DEU")[1]
  const schoolSpending = {
    id: "school_spending",
    topic: "education",
    q: [
      "La France consacre-t-elle moins de moyens à ses élèves que ses voisins ?",
      "Does France spend less on its pupils than its neighbours?",
    ],
    spark: P.constant.FRA,
    value: f => dollars(f)(fra),
    headline: f => ({
      label: [
        `dépensés par élève du secondaire en ${P.year}, en dollars à parité de pouvoir d'achat`,
        `spent per secondary pupil in ${P.year}, in purchasing-power-parity dollars`,
      ],
      vs: [
        `moyenne OCDE : ${dollars(f)(oecd)} · Allemagne : ${dollars(f)(deu)} · ${signed(f, change(P.constant.FRA[py], P.constant.FRA[P.years.indexOf("2015")]))} depuis 2015, hors inflation`,
        `OECD average: ${dollars(f)(oecd)} · Germany: ${dollars(f)(deu)} · ${signed(f, change(P.constant.FRA[py], P.constant.FRA[P.years.indexOf("2015")]))} since 2015, after inflation`,
      ],
    }),
    compare: f => ({
      caption: [
        `Dépense par élève du secondaire, ${P.year}, en dollars PPA`,
        `Spending per secondary pupil, ${P.year}, PPP dollars`,
      ],
      rows: rowsOf(f, P.rows, status =>
        status === "W"
          ? f.L([
              "Comprend des données d'une autre catégorie (OCDE)",
              "Includes data from another category (OECD)",
            ])
          : null,
      ),
      fmt: dollars(f),
    }),
    chart: f => ({
      caption: [
        "En dollars constants de 2020, à parité de pouvoir d'achat",
        "In constant 2020 dollars, at purchasing power parity",
      ],
      x: P.years,
      series: [
        { label: "France", values: P.constant.FRA, emph: true },
        { label: f.L(NAMES.DEU), values: P.constant.DEU },
        { label: f.L(NAMES.ESP), values: P.constant.ESP },
        { label: f.L(["OCDE", "OECD"]), values: P.constant.OECD },
      ],
      fmtY: whole(f),
      fmtV: dollars(f),
      fmtX: x => x,
      ticks: everyYears(P.years, 2),
    }),
    cant: [
      [
        "Ce sont les dernières données comparables : l'OCDE publie avec environ trois ans de décalage.",
        "These are the latest comparable figures: the OECD publishes about three years behind.",
      ],
      [
        "La dépense par élève ne dit rien de son usage (salaires, taille des classes, bâtiments), ni des résultats.",
        "Spending per pupil says nothing about how it is used (salaries, class sizes, buildings), nor about results.",
      ],
      [
        "La parité de pouvoir d'achat corrige les écarts de prix entre pays, pas les écarts de richesse.",
        "Purchasing power parity corrects for price differences between countries, not for differences in wealth.",
      ],
      [
        "Pour la Belgique et l'Italie, l'OCDE signale que les chiffres incluent des données d'une autre catégorie.",
        "For Belgium and Italy, the OECD notes that the figures include data from another category.",
      ],
    ],
    source: {
      producer:
        "OCDE · Regards sur l'éducation (dépense par élève, indicateur C1.1)",
      cadence: ["Annuelle", "Yearly"],
      latest: () => P.year,
      next: ["septembre 2027", "September 2027"],
      type: "official",
    },
  }

  /* ---------- taxes ---------- */
  const Tx = S.tax
  const taxRate = g => Tx.rows.find(r => r[0] === g)[1]
  const isTop = x => x.startsWith("P99.9998–")
  const DECILES = {
    D1: ["D1 · les 10 % les plus modestes", "D1 · poorest 10%"],
    D10: ["D10 · les 10 % les plus aisés", "D10 · richest 10%"],
    V20: ["Les 5 % les plus aisés", "Richest 5%"],
    Ensemble: ["Ensemble", "Everyone"],
  }
  const taxFairness = {
    id: "tax_fairness",
    topic: "public",
    q: [
      "Les plus aisés paient-ils proportionnellement moins d'impôts ?",
      "Do the wealthiest pay proportionally less tax?",
    ],
    spark: null,
    value: f => f.pct(taxRate("V20")),
    headline: f => ({
      label: [
        `des revenus des 5 % les plus aisés partent en impôts et cotisations, ${Tx.year}`,
        `of the income of the richest 5% goes in taxes and contributions, ${Tx.year}`,
      ],
      vs: [
        `ensemble de la population : ${f.pct(taxRate("Ensemble"))} · 10 % les plus modestes : ${f.pct(taxRate("D1"))} · tout en haut, selon l'IPP (données 2016) : ${f.pct(Tx.ippWith[Tx.ippWith.length - 1], 0)} pour les 75 foyers les plus riches`,
        `whole population: ${f.pct(taxRate("Ensemble"))} · poorest 10%: ${f.pct(taxRate("D1"))} · at the very top, per the IPP (2016 data): ${f.pct(Tx.ippWith[Tx.ippWith.length - 1], 0)} for the 75 richest households`,
      ],
    }),
    compare: f => ({
      caption: [
        `Impôts et cotisations en % des revenus (prestations comprises), par dixième de niveau de vie, ${Tx.year}`,
        `Taxes and contributions as % of income (benefits included), by tenth of standard of living, ${Tx.year}`,
      ],
      rows: Tx.rows.map(([g, v]) => ({
        key: g,
        label: f.L(DECILES[g] || [g, g]),
        value: v,
        emph: g === "V20",
        aggregate: g === "Ensemble",
      })),
      fmt: v => f.pct(v),
    }),
    chart: f => ({
      caption: [
        "Tout en haut de l'échelle : taux effectif des 10 % les plus aisés jusqu'aux milliardaires, étude IPP, données 2016 (relevé à la main)",
        "At the very top: effective rate from the richest 10% to billionaires, IPP study, 2016 data (transcribed by hand)",
      ],
      x: Tx.ippGroups,
      series: [
        {
          label: f.L(["Avec sociétés", "With firms"]),
          values: Tx.ippWith,
          emph: true,
        },
        { label: f.L(["Foyer seul", "Household"]), values: Tx.ippWithout },
      ],
      fmtY: v => f.pct(v, 0),
      fmtX: (x, short) =>
        isTop(x)
          ? f.L(
              short
                ? ["Milliardaires", "Billionaires"]
                : [
                    "Les 0,0002 % les plus riches (« milliardaires »)",
                    "Top 0.0002% (“billionaires”)",
                  ],
            )
          : x,
      ticks: Tx.ippGroups
        .map((g, i) => [g, i])
        .filter(
          ([g]) =>
            ["P90", "P99", "P99.9", "P99.99", "P99.999"].includes(g) ||
            isTop(g),
        )
        .map(([, i]) => i),
    }),
    cant: [
      [
        "Le taux Insee compte tous les prélèvements, TVA et cotisations sociales compris (qui financent aussi les retraites), rapportés aux revenus prestations comprises. Nous le calculons à partir des montants publiés par l'Insee.",
        "Insee's rate counts every levy, VAT and social contributions included (which also fund pensions), against income including benefits. We compute it from the amounts Insee publishes.",
      ],
      [
        "Les données de l'Insee s'arrêtent aux 5 % les plus aisés : au-delà, seule l'étude de l'IPP renseigne, sur des données de 2016, avant la création de l'IFI, du prélèvement forfaitaire unique et la baisse de l'impôt sur les sociétés.",
        "Insee's data stops at the richest 5%: above that, only the IPP study tells, on 2016 data, before the wealth-tax reform, the flat tax on capital income and the cut in corporate tax.",
      ],
      [
        "La baisse tout en haut dépend d'un choix de l'IPP : compter comme revenu les bénéfices non distribués des sociétés que ces foyers contrôlent. Le gouvernement a qualifié ce choix de « non consensuel » (réponse à une question écrite, 2025). Sans ce choix (courbe « Foyer seul »), le taux reste autour de 37 à 41 %.",
        "The drop at the very top depends on a choice by the IPP: counting as income the undistributed profits of the firms these households control. The government called this choice “not consensual” (answer to a written question, 2025). Without it (the “Household” curve), the rate stays around 37 to 41%.",
      ],
      [
        "L'étude de l'IPP ne compte que les impôts directs, pas la TVA : ses taux ne se comparent pas à ceux de l'Insee.",
        "The IPP study counts direct taxes only, not VAT: its rates don't compare with Insee's.",
      ],
    ],
    source: {
      producer:
        "Insee · comptes nationaux distribués ; Institut des politiques publiques (note n° 92)",
      cadence: ["Éditions ponctuelles", "Occasional editions"],
      latest: () => `${Tx.year} · 2016 (IPP)`,
      next: ["novembre 2026 (tableaux Insee)", "November 2026 (Insee tables)"],
      note: [
        "Les taux de l'IPP sont relevés à la main dans sa note, une partie directement sur son graphique.",
        "The IPP rates are transcribed by hand from its note, some read directly off its chart.",
      ],
      documents: Tx.documents.map(([label, url]) => [[label, label], url]),
      type: "official",
    },
  }

  /* ---------- young people's mental health ---------- */
  const Mh = S.mental
  const hy = Mh.years.length - 1
  const ey2 = Mh.erYears.length - 1
  const pick = words =>
    Mh.bulletin.find(b => words.some(w => b.statement_fr.includes(w)))
  const bulletinQuotes = [
    pick(["très supérieurs"]),
    pick(["gestes suicidaires restent"]),
    pick(["dynamique saisonnière"]),
  ].filter(Boolean)
  const mentalHealth = {
    id: "mental_health",
    topic: "health",
    q: [
      "La santé mentale des jeunes se dégrade-t-elle ?",
      "Is young people's mental health getting worse?",
    ],
    spark: Mh.hosp["15-17:female"],
    value: f => whole(f)(Mh.hosp["15-17:female"][hy]),
    headline: f => ({
      label: [
        `hospitalisations pour geste auto-infligé pour 100 000 filles de 15 à 17 ans, ${Mh.years[hy]}`,
        `hospital stays for self-harm per 100,000 girls aged 15 to 17, ${Mh.years[hy]}`,
      ],
      vs: [
        `${whole(f)(Mh.hosp["15-17:female"][0])} en ${Mh.years[0]} · garçons du même âge : ${whole(f)(Mh.hosp["15-17:male"][hy])} (${whole(f)(Mh.hosp["15-17:male"][0])} en ${Mh.years[0]})`,
        `${whole(f)(Mh.hosp["15-17:female"][0])} in ${Mh.years[0]} · boys of the same age: ${whole(f)(Mh.hosp["15-17:male"][hy])} (${whole(f)(Mh.hosp["15-17:male"][0])} in ${Mh.years[0]})`,
      ],
    }),
    chart: f => ({
      caption: [
        "Hospitalisations pour geste auto-infligé pour 100 000 jeunes, par âge et sexe",
        "Hospital stays for self-harm per 100,000 young people, by age and sex",
      ],
      x: Mh.years,
      series: [
        {
          label: f.L(["Filles 15-17", "Girls 15-17"]),
          values: Mh.hosp["15-17:female"],
          emph: true,
        },
        {
          label: f.L(["Filles 11-14", "Girls 11-14"]),
          values: Mh.hosp["11-14:female"],
        },
        {
          label: f.L(["Filles 18-24", "Women 18-24"]),
          values: Mh.hosp["18-24:female"],
        },
        {
          label: f.L(["Garçons 15-17", "Boys 15-17"]),
          values: Mh.hosp["15-17:male"],
        },
      ],
      fmtY: whole(f),
      fmtX: x => x,
      ticks: Mh.years.map((_, i) => i),
    }),
    tiles: [
      {
        label: [
          `Passages aux urgences pour geste auto-infligé, filles de 11 à 14 ans, ${Mh.erYears[ey2]}, pour 100 000 passages`,
          `ER visits for self-harm, girls aged 11 to 14, ${Mh.erYears[ey2]}, per 100,000 visits`,
        ],
        value: Mh.er["11-14:female"][ey2],
        series: Mh.er["11-14:female"],
        fmt: whole,
      },
      {
        label: [
          `Pensées suicidaires dans l'année, 18-29 ans, 2024 (ensemble des adultes : ${Mh.survey.thoughts[1].toString().replace(".", ",")} %)`,
          `Suicidal thoughts in the past year, aged 18-29, 2024 (all adults: ${Mh.survey.thoughts[1]}%)`,
        ],
        value: Mh.survey.thoughts[0],
      },
    ],
    quotes: f => ({
      caption: bulletinQuotes.length
        ? [
            `Le dernier bulletin de Santé publique France (${f.month(bulletinQuotes[0].period_covered)})`,
            `Santé publique France's latest bulletin (${f.month(bulletinQuotes[0].period_covered)})`,
          ]
        : ["", ""],
      items: bulletinQuotes.map(b => ({
        text: [b.statement_fr, b.statement_en],
        source: [
          `Bulletin n° ${b.bulletin_no}, p. ${b.page}`,
          `Bulletin no. ${b.bulletin_no}, p. ${b.page}`,
        ],
        url: b.url,
      })),
    }),
    cant: [
      [
        "Ces chiffres comptent les gestes auto-infligés (tentatives de suicide et automutilations), pas la santé mentale dans son ensemble. Aucune série ouverte ne suit la dépression ou l'anxiété des mineurs : pour les mois récents, seul le bulletin mensuel en parle, en mots.",
        "These figures count self-harm (suicide attempts and self-injury), not mental health as a whole. No open series tracks depression or anxiety among minors: for recent months, only the monthly bulletin covers them, in words.",
      ],
      [
        "Les séries commencent en 2019 (hôpital) et 2020 (urgences) : pas de recul avant le Covid. 2020 est un creux, les hôpitaux ayant reçu moins de patients.",
        "The series start in 2019 (hospital) and 2020 (ER): no view back before Covid. 2020 is a dip, as hospitals saw fewer patients.",
      ],
      [
        "Les hôpitaux psychiatriques ne sont pas comptés. Aux urgences, le chiffre est une part de l'activité (pour 100 000 passages), pas un taux par habitant, et la Provence-Alpes-Côte d'Azur et la Corse sont sous-comptées depuis 2022.",
        "Psychiatric hospitals aren't counted. In the ER, the figure is a share of activity (per 100,000 visits), not a rate per inhabitant, and Provence-Alpes-Côte d'Azur and Corsica are undercounted since 2022.",
      ],
      [
        "Les données par département existent pour les urgences, mais varient surtout selon la façon dont chaque service code les diagnostics : nous ne les cartographions pas.",
        "Département data exists for ER visits, but varies mostly with how each unit codes diagnoses: we don't map it.",
      ],
    ],
    source: {
      producer:
        "Santé publique France · hospitalisations (PMSI) et urgences (Oscour) pour geste auto-infligé ; Baromètre 2024",
      cadence: [
        "Annuelle, et un bulletin mensuel",
        "Yearly, and a monthly bulletin",
      ],
      latest: f =>
        `${Mh.years[hy]} · ${bulletinQuotes[0] ? f.month(bulletinQuotes[0].period_covered) : ""}`,
      next: ["décembre 2026 (données 2025)", "December 2026 (2025 data)"],
      note: [
        "Les extraits du bulletin mensuel sont relevés à la main dans le document.",
        "The extracts from the monthly bulletin are transcribed by hand from the document.",
      ],
      documents: bulletinQuotes.length
        ? [
            [
              [
                `Bulletin santé mentale n° ${bulletinQuotes[0].bulletin_no}`,
                `Mental health bulletin no. ${bulletinQuotes[0].bulletin_no}`,
              ],
              bulletinQuotes[0].url,
            ],
          ]
        : null,
      type: "official",
    },
  }

  /* ---------- social fraud ---------- */
  const Fr = S.fraud
  const billions = (f, v, d = 0) =>
    f.lang === "fr"
      ? `${f.num(v / 1000, { minimumFractionDigits: d, maximumFractionDigits: d })} Md€`
      : `€${f.num(v / 1000, { minimumFractionDigits: d, maximumFractionDigits: d })}bn`
  const millions = f => v =>
    f.lang === "fr" ? `${whole(f)(v)} M€` : `€${whole(f)(v)}m`
  const fraudYear = Object.keys(Fr.estimated).sort().pop()
  const COMPONENTS = {
    companies: [
      "Cotisations (entreprises, travail dissimulé)",
      "Contributions (firms, undeclared work)",
    ],
    claimants: ["Allocataires", "Benefit claimants"],
    health_professionals: ["Professionnels de santé", "Health professionals"],
  }
  const sorted = obj =>
    Object.keys(obj)
      .sort()
      .map(k => obj[k])
  const fraud = {
    id: "fraud",
    topic: "social",
    q: [
      "Combien coûte la fraude sociale ?",
      "How much does benefit fraud cost?",
    ],
    spark: Fr.series.cnam,
    value: f => billions(f, Fr.estimated[fraudYear]),
    headline: f => ({
      label: [
        `de fraude sociale estimée pour ${fraudYear}, tous organismes confondus (HCFiPS)`,
        `of social fraud estimated for ${fraudYear}, across all bodies (HCFiPS)`,
      ],
      vs: [
        `fraude détectée la même année : ${billions(f, Fr.detected[fraudYear], 2)} · récupérée : ${millions(f)(Fr.recovered[fraudYear])}`,
        `fraud detected the same year: ${billions(f, Fr.detected[fraudYear], 2)} · recovered: ${millions(f)(Fr.recovered[fraudYear])}`,
      ],
    }),
    compare: f => ({
      caption: [
        `Fraude estimée selon son origine, ${fraudYear} (HCFiPS)`,
        `Estimated fraud by origin, ${fraudYear} (HCFiPS)`,
      ],
      rows: Fr.components.map(([k, v]) => ({
        key: k,
        label: f.L(COMPONENTS[k]),
        value: v,
      })),
      fmt: v => billions(f, v, 1),
    }),
    chart: f => ({
      caption: [
        "Fraude détectée chaque année par organisme, en millions d'euros : chacun la mesure à sa façon, ces montants ne s'additionnent pas",
        "Fraud detected each year by each body, € million: each measures it its own way, so these amounts don't add up",
      ],
      x: Fr.years,
      series: [
        { label: "Urssaf", values: Fr.series.urssaf },
        {
          label: f.L(["Maladie", "Health"]),
          values: Fr.series.cnam,
          emph: true,
        },
        { label: f.L(["CAF", "Family funds"]), values: Fr.series.cnaf },
      ],
      fmtY: whole(f),
      fmtV: millions(f),
      fmtX: x => x,
      ticks: everyYears(Fr.years, 2),
    }),
    tiles: [
      {
        label: [
          `Fraude détectée, tous organismes, ${fraudYear}`,
          `Fraud detected, all bodies, ${fraudYear}`,
        ],
        value: Fr.detected[fraudYear],
        series: sorted(Fr.detected),
        fmt: millions,
      },
      {
        label: [
          `Montants récupérés, ${fraudYear}`,
          `Amounts recovered, ${fraudYear}`,
        ],
        value: Fr.recovered[fraudYear],
        series: sorted(Fr.recovered),
        fmt: millions,
      },
    ],
    cant: [
      [
        "La fraude estimée et la fraude détectée ne mesurent pas la même chose et ne s'additionnent pas. Une hausse de la fraude détectée peut venir de contrôles mieux ciblés plutôt que de plus de fraude.",
        "Estimated fraud and detected fraud don't measure the same thing and don't add up. A rise in detected fraud can come from better-targeted checks rather than more fraud.",
      ],
      [
        "Chaque organisme mesure à sa façon : l'Assurance maladie compte la fraude « détectée et stoppée », qui inclut les pertes évitées ; l'Urssaf compte les redressements notifiés, dont une petite partie seulement est encaissée.",
        "Each body measures in its own way: health insurance counts fraud “detected and stopped”, which includes losses avoided; Urssaf counts the reassessments it issues, only a small part of which is collected.",
      ],
      [
        "L'estimation totale extrapole des contrôles aléatoires, sur des années de référence qui diffèrent selon les organismes.",
        "The total estimate extrapolates random checks, over reference years that differ from one body to another.",
      ],
      [
        "Une erreur de versement n'est pas une fraude : les indus dus à des erreurs ne sont pas comptés ici.",
        "A payment error isn't fraud: overpayments due to mistakes aren't counted here.",
      ],
    ],
    source: {
      producer:
        "HCFiPS ; Cnaf ; Assurance maladie ; Assurance retraite ; Urssaf ; Cour des comptes",
      cadence: ["Annuelle, relevée à la main", "Yearly, transcribed by hand"],
      latest: () => `${Fr.years[Fr.years.length - 1]} · ${fraudYear}`,
      next: [
        "janvier 2027 (HCFiPS), printemps 2027 (organismes)",
        "January 2027 (HCFiPS), spring 2027 (funds)",
      ],
      note: [
        "Aucune série ouverte n'existe : chaque chiffre est relevé à la main dans les documents ci-dessous. Certains chiffres de la CAF et de l'Assurance maladie ne paraissent que dans les rapports de la Cour des comptes ; le chiffre 2023 imprimé dans le dossier de presse de la CAF est une coquille, nous retenons celui de la Cour.",
        "No open series exists: every figure is transcribed by hand from the documents below. Some family-fund and health-insurance figures only appear in the Cour des comptes reports; the 2023 figure printed in the family funds' press kit is a typo, so we use the Cour's.",
      ],
      documents: Fr.documents.map(([label, url]) => {
        const clean = label.replace(/^Cité dans : /, "")
        return [[clean, clean], url]
      }),
      type: "transcribed",
    },
  }

  /* ---------- farm income ---------- */
  const Fa = S.farm
  const fy = Fa.years.length - 1
  const fAt = y => Fa.perWorker[Fa.years.indexOf(y)]
  const ty = Fa.typeYears.length - 1
  const keur = f => v =>
    f.lang === "fr"
      ? `${f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} k€`
      : `€${f.num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
  const FARM_TYPES = [
    ["all", ["Toutes exploitations", "All farms"]],
    [
      "cereals_oilseeds",
      ["Céréales et oléoprotéagineux", "Cereals and oilseeds"],
    ],
    ["wine", ["Viticulture", "Wine growing"]],
    ["dairy", ["Bovins lait", "Dairy"]],
  ]
  const farmIncome = {
    id: "farm_income",
    topic: "economy",
    q: [
      "Le revenu des agriculteurs baisse-t-il ?",
      "Are farmers' incomes falling?",
    ],
    spark: Fa.perWorker.slice(-20),
    value: f => euros(f)(Fa.perWorker[fy] * 1000),
    headline: f => ({
      label: [
        `de résultat agricole net par actif non salarié en ${Fa.years[fy]} (provisoire), en euros de ${Fa.years[fy]}`,
        `net farm result per non-salaried worker in ${Fa.years[fy]} (provisional), in ${Fa.years[fy]} euros`,
      ],
      vs: [
        `${signed(f, Fa.change[fy])} sur un an, après ${signed(f, Fa.change[fy - 1])} et ${signed(f, Fa.change[fy - 2])} · 2022 : ${euros(f)(fAt("2022") * 1000)} · 2000 : ${euros(f)(fAt("2000") * 1000)}`,
        `${signed(f, Fa.change[fy])} on a year, after ${signed(f, Fa.change[fy - 1])} and ${signed(f, Fa.change[fy - 2])} · 2022: ${euros(f)(fAt("2022") * 1000)} · 2000: ${euros(f)(fAt("2000") * 1000)}`,
      ],
    }),
    chart: f => ({
      caption: [
        `Résultat agricole net par actif non salarié, en milliers d'euros de ${Fa.years[fy]}`,
        `Net farm result per non-salaried worker, thousand ${Fa.years[fy]} euros`,
      ],
      x: Fa.years,
      series: [
        {
          label: f.L(["Par actif", "Per worker"]),
          values: Fa.perWorker,
          emph: true,
        },
      ],
      fmtY: v => (f.lang === "fr" ? `${whole(f)(v)} k€` : `€${whole(f)(v)}k`),
      fmtV: v => euros(f)(v * 1000),
      fmtX: x => x,
      ticks: everyYears(Fa.years, 5),
    }),
    compare: f => ({
      caption: [
        `Revenu agricole réel par actif en ${Fa.euYear} (estimation), indice 100 en 2020`,
        `Real farm income per worker in ${Fa.euYear} (estimate), index 2020 = 100`,
      ],
      rows: rowsOf(f, Fa.euRows),
      fmt: oneDecimal(f),
    }),
    tiles: FARM_TYPES.map(([k, label]) => ({
      label: [
        `${label[0]} : revenu courant par actif, ${Fa.typeYears[ty]}`,
        `${label[1]}: current income per worker, ${Fa.typeYears[ty]}`,
      ],
      value: Fa.types[k][ty],
      series: Fa.types[k],
      fmt: keur,
    })),
    cant: [
      [
        "Le revenu agricole varie de 30 % d'une année à l'autre, au gré des prix et des récoltes : mieux vaut regarder plusieurs années que la dernière.",
        "Farm income swings by 30% from one year to the next with prices and harvests: look at several years rather than the latest one.",
      ],
      [
        `Le revenu par actif monte aussi parce que les agriculteurs sont de moins en moins nombreux : ${(Fa.fte[0] / 1000).toFixed(2).replace(".", ",")} million d'actifs non salariés en ${Fa.years[0]}, ${Math.round(Fa.fte[fy])} 000 en ${Fa.years[fy]}.`,
        `Income per worker also rises because there are fewer and fewer farmers: ${(Fa.fte[0] / 1000).toFixed(2)} million non-salaried workers in ${Fa.years[0]}, ${Math.round(Fa.fte[fy])},000 in ${Fa.years[fy]}.`,
      ],
      [
        "Une moyenne cache des écarts énormes selon les productions et les exploitations ; le revenu par type d'exploitation (RICA) ne couvre que les moyennes et grandes exploitations, et comprend les aides publiques.",
        "An average hides huge gaps between types of farming and farms; income by farm type (RICA) covers only medium and large farms, and includes public subsidies.",
      ],
      [
        "Ce n'est pas le revenu du ménage agricole, qui peut avoir d'autres revenus. Le chiffre de l'année la plus récente est provisoire.",
        "This isn't the farm household's income, which may have other income. The latest year's figure is provisional.",
      ],
    ],
    source: {
      producer:
        "Insee · comptes de l'agriculture ; Agreste · RICA ; Eurostat (voisins)",
      cadence: ["Annuelle", "Yearly"],
      latest: () => `${Fa.years[fy]} · ${Fa.typeYears[ty]} (RICA)`,
      next: [
        "décembre 2026 (RICA 2025), juillet 2027 (compte 2026)",
        "December 2026 (RICA 2025), July 2027 (2026 accounts)",
      ],
      type: "official",
    },
  }

  /* ---------- heatwaves ---------- */
  const He = S.heat
  const hl = He.days.length - 1
  const decade = d => He.decades.find(r => r[0] === d)
  const record = He.days[hl] === Math.max(...He.days)
  const heat = {
    id: "heat",
    topic: "environment",
    q: [
      "Les vagues de chaleur sont-elles plus fréquentes en France ?",
      "Are heatwaves more frequent in France?",
    ],
    spark: He.days.slice(-30),
    value: f => whole(f)(He.days[hl]),
    headline: f => ({
      label: [
        `jours de vague de chaleur nationale à l'été ${He.years[hl]}${record ? ", un record depuis 1947" : ""}`,
        `days of national heatwave in summer ${He.years[hl]}${record ? ", a record since 1947" : ""}`,
      ],
      vs: [
        `${decade("2020")[1]} vagues de chaleur depuis 2020, en ${decade("2020")[3]} étés · ${decade("2010")[1]} dans les années 2010 · ${decade("1990")[1]} dans les années 1990 · ${He.count} depuis 1947`,
        `${decade("2020")[1]} heatwaves since 2020, in ${decade("2020")[3]} summers · ${decade("2010")[1]} in the 2010s · ${decade("1990")[1]} in the 1990s · ${He.count} since 1947`,
      ],
    }),
    chart: f => ({
      caption: [
        "Jours de vague de chaleur nationale, chaque été",
        "Days of national heatwave, each summer",
      ],
      x: He.years,
      series: [{ label: f.L(["Jours", "Days"]), values: He.days, emph: true }],
      fmtY: whole(f),
      fmtX: x => x,
      ticks: everyYears(He.years, 10),
    }),
    compare: f => ({
      caption: [
        "Jours de vague de chaleur par été, en moyenne sur chaque décennie",
        "Heatwave days per summer, averaged over each decade",
      ],
      rows: He.decades.map(([d, , days, summers]) => ({
        key: d,
        label:
          d === "1940"
            ? "1947-1949"
            : d === "2020"
              ? `2020-${He.years[hl]}`
              : f.L([`Années ${d}`, `${d}s`]),
        value: days / summers,
        emph: d === "2020",
      })),
      fmt: oneDecimal(f),
    }),
    tiles: [
      {
        label: [
          "Vague la plus longue (1983, 2026)",
          "Longest heatwave (1983, 2026)",
        ],
        value: He.longest,
        fmt: f => v => f.L([`${v} jours`, `${v} days`]),
      },
      {
        label: [
          `Indicateur thermique le plus élevé (${He.peak[1].slice(0, 4)})`,
          `Highest thermal indicator (${He.peak[1].slice(0, 4)})`,
        ],
        value: He.peak[0],
        fmt: f => v => `${oneDecimal(f)(v)} °C`,
      },
    ],
    cant: [
      [
        "Une vague de chaleur nationale suit la définition de Météo-France : la moyenne des températures de 30 stations dépasse 25,3 °C au moins un jour et reste au-dessus de 23,4 °C au moins trois jours. Les canicules locales et les nuits chaudes ne sont pas comptées.",
        "A national heatwave follows Météo-France's definition: the average temperature of 30 stations exceeds 25.3 °C on at least one day and stays above 23.4 °C for at least three days. Local heatwaves and hot nights aren't counted.",
      ],
      [
        "Les années 1940 ne comptent que trois étés (1947-1949) et les années 2020 sept : comparer par été, pas par décennie entière.",
        "The 1940s count only three summers (1947-1949) and the 2020s seven: compare per summer, not whole decades.",
      ],
      [
        "Météo-France a révisé sa liste et son indicateur au fil du temps : des textes anciens citent d'autres épisodes et d'autres valeurs.",
        "Météo-France has revised its list and indicator over time: older texts cite other episodes and values.",
      ],
    ],
    source: {
      producer:
        "Météo-France · liste des vagues de chaleur (indicateur thermique national)",
      cadence: [
        "Après chaque été, relevée à la main",
        "After each summer, transcribed by hand",
      ],
      latest: f =>
        f.date(He.last, { day: "numeric", month: "long", year: "numeric" }),
      next: [
        "septembre 2027 (bilan de l'été)",
        "September 2027 (summer review)",
      ],
      note: [
        `Météo-France ne publie pas cette liste en données : les ${He.count} épisodes sont relevés à la main dans son bilan de l'été 2026 et ses bulletins. Pour les épisodes anciens dont aucun texte ne donne les dates, seules l'année et la durée sont connues.`,
        `Météo-France doesn't publish this list as data: the ${He.count} episodes are transcribed by hand from its summer 2026 review and its bulletins. For older episodes that no text dates, only the year and length are known.`,
      ],
      documents: [
        [
          [
            "Météo-France, bilan climatique de l'été 2026",
            "Météo-France, summer 2026 climate review",
          ],
          "https://meteofrance.fr/sites/default/files/files/editorial/bilan-climatique-ete-2026-meteo-france.pdf",
        ],
        [
          [
            "Météo-France, vagues de chaleur et changement climatique",
            "Météo-France, heatwaves and climate change",
          ],
          "https://meteofrance.com/changement-climatique/changement-climatique-quel-impact-sur-les-vagues-de-chaleur",
        ],
        [
          [
            "Météo-France, définition d'une vague de chaleur",
            "Météo-France, what counts as a heatwave",
          ],
          "https://meteofrance.com/meteo-a-z/canicule-pic-ou-vague-de-chaleur-quelles-differences",
        ],
      ],
      type: "transcribed",
    },
  }

  /* ---------- teachers ---------- */
  const Te = S.teachers
  const sn = Te.sessions.length - 1
  const s25 = Te.sessions.indexOf("2025")
  const sAt = s => Te.unfilled[Te.sessions.indexOf(s)]
  const hoursLast = Te.hours.total[Te.hours.total.length - 1]
  const notReplaced =
    Te.hours.non_replacement[Te.hours.non_replacement.length - 1]
  const teachers = {
    id: "teachers",
    topic: "education",
    q: ["Manque-t-on d'enseignants ?", "Is France short of teachers?"],
    spark: Te.unfilled,
    value: f => whole(f)(Te.unfilled[s25]),
    headline: f => ({
      label: [
        "postes non pourvus aux concours externes d'enseignants en 2025",
        "posts left unfilled at the external teacher recruitment exams in 2025",
      ],
      vs: [
        `${whole(f)(sAt("2022"))} en 2022 · ${whole(f)(sAt("2016"))} en 2016 · 2026 : ${whole(f)(Te.unfilled[sn])} pour ${whole(f)(Te.posts[sn])} postes, avec deux concours la même année`,
        `${whole(f)(sAt("2022"))} in 2022 · ${whole(f)(sAt("2016"))} in 2016 · 2026: ${whole(f)(Te.unfilled[sn])} out of ${whole(f)(Te.posts[sn])} posts, with two exams in the same year`,
      ],
    }),
    chart: f => ({
      caption: [
        "Part des postes pourvus aux concours externes publics, par concours",
        "Share of posts filled at the external public exams, by exam",
      ],
      x: Te.sessions,
      series: [
        { label: "CRPE", values: Te.fill.crpe, emph: true },
        { label: "Capes", values: Te.fill.capes },
        {
          label: f.L(["Agrégation", "Agrégation"]),
          values: Te.fill.agregation,
        },
        { label: "Capet", values: Te.fill.capet },
        { label: "CAPLP", values: Te.fill.caplp },
      ],
      marks: [
        {
          at: Te.sessions.indexOf("2022"),
          label: f.L([
            "2022 : concours en fin de master",
            "2022: exams moved to the end of the master's",
          ]),
        },
        {
          at: sn,
          row: 1,
          label: f.L([
            "2026 : deux concours (bac+3 et bac+5)",
            "2026: two exams (bac+3 and bac+5)",
          ]),
        },
      ],
      fmtY: v => f.pct(v, 0),
      fmtV: v => f.pct(v, 0),
      fmtX: x => x,
      ticks: everyYears(Te.sessions, 2),
    }),
    tiles: [
      {
        label: [
          `Heures de cours non assurées, collèges et lycées publics, ${hoursLast[0]}`,
          `Teaching hours not delivered, public secondary schools, ${hoursLast[0]}`,
        ],
        value: hoursLast[1],
        series: Te.hours.total.map(([, v]) => v),
      },
      {
        label: [
          `dont absences non remplacées, ${notReplaced[0]} (en points)`,
          `of which absences not replaced, ${notReplaced[0]} (in points)`,
        ],
        value: notReplaced[1],
        series: Te.hours.non_replacement.map(([, v]) => v),
      },
      {
        label: [
          `Enseignants en poste, public et privé, ${Te.headcountYears[Te.headcountYears.length - 1]}`,
          `Teachers in post, public and private, ${Te.headcountYears[Te.headcountYears.length - 1]}`,
        ],
        value: Te.headcount[Te.headcount.length - 1],
        series: Te.headcount,
        fmt: whole,
      },
    ],
    cant: [
      [
        "CRPE : professeurs des écoles ; Capes, Capet et CAPLP : collèges et lycées (général, technologique, professionnel) ; agrégation : surtout lycées.",
        "CRPE: primary teachers; Capes, Capet and CAPLP: secondary schools (general, technological, vocational); agrégation: mostly lycées.",
      ],
      [
        "Un poste non pourvu au concours n'est pas une classe sans professeur : il est souvent couvert par un contractuel. À l'inverse, les démissions et les départs ne sont pas comptés ici.",
        "A post left unfilled at the exam isn't a class without a teacher: it's often covered by a contract teacher. Conversely, resignations and departures aren't counted here.",
      ],
      [
        "En 2022, le concours passe en fin de master : moins de candidats, d'où la chute. En 2026, deux concours se tiennent la même année (bac+3 et bac+5) : les postes offerts bondissent, ce n'est pas une tendance.",
        "In 2022 the exam moved to the end of the master's: fewer candidates, hence the drop. In 2026 two exams ran the same year (bac+3 and bac+5): posts jump, which isn't a trend.",
      ],
      [
        "Les moyennes nationales cachent des disciplines en tension : en 2025, 71 % des postes du Capes de mathématiques étaient pourvus, 56 % en mathématiques-physique au CAPLP (DEPP).",
        "National averages hide subjects under strain: in 2025, 71% of Capes maths posts were filled, 56% in maths-physics at the CAPLP (DEPP).",
      ],
      [
        "Les heures non assurées ne sont publiées que pour deux années, et seulement pour les collèges et lycées publics.",
        "Hours not delivered are published for two years only, and only for public secondary schools.",
      ],
    ],
    source: {
      producer:
        "Ministère de l'Éducation nationale · résultats des concours ; DEPP · Repères et références statistiques 2026",
      cadence: ["Annuelle", "Yearly"],
      latest: () => `${Te.sessions[sn]} · ${hoursLast[0]}`,
      next: ["automne 2027 (session 2027)", "autumn 2027 (2027 session)"],
      note: [
        "Les résultats 2021 à 2026 sont relevés sur les pages de résultats des concours ; les heures non assurées et les effectifs sont relevés à la main dans le RERS 2026 (chapitre 9).",
        "The 2021 to 2026 results are read from the exam results pages; hours not delivered and headcounts are transcribed by hand from RERS 2026 (chapter 9).",
      ],
      documents: [
        [
          [
            "DEPP, RERS 2026, chapitre 9 « Les personnels »",
            "DEPP, RERS 2026, chapter 9 (staff)",
          ],
          "https://www.education.gouv.fr/sites/default/files/document/9-les-personnelspdf-519300.pdf",
        ],
        [
          [
            "Résultats des concours (devenirenseignant.gouv.fr)",
            "Exam results (devenirenseignant.gouv.fr)",
          ],
          "https://www.devenirenseignant.gouv.fr/statistiques",
        ],
      ],
      type: "official",
    },
  }

  return {
    violence,
    sexual_violence: sexualViolence,
    immigration,
    removals,
    debt,
    industry,
    pensioners,
    doctors,
    emissions,
    school_spending: schoolSpending,
    tax_fairness: taxFairness,
    mental_health: mentalHealth,
    fraud,
    farm_income: farmIncome,
    heat,
    teachers,
  }
}
