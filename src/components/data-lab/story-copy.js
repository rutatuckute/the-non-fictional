// Every editorial line of the "Connect the dots" story, in one place.
//
// English is the editorial master. The French lines are provisional drafts,
// written to hold the page until the French rewrite (it is French by
// default): each is marked FR-DRAFT. Rewrite them in French, don't translate
// the English word for word.
//
// Quotations are never written here: they come from data/threads.json,
// verbatim, in the language they were spoken. What this file adds for the
// followed thread is (a) the short fragment of each quote that carries the
// argument, which must be an exact substring of the quote (checked at
// runtime, and dropped if not), and (b) our English translation, always
// labelled as ours.

export const say = (f, entry, vars = {}) => {
  if (!entry) return ""
  const v = f.lang === "fr" ? (entry.fr ?? entry.en) : entry.en
  const s = typeof v === "function" ? v(vars) : v
  // French typography (narrow spaces before ? ! : ; and inside guillemets)
  return f.lang === "fr" ? f.L([s, s]) : s
}

export const ACTS = [
  { id: "matters", en: "What matters", fr: "Ce qui compte" }, // FR-DRAFT
  { id: "said", en: "What is said", fr: "Ce qui se dit" }, // FR-DRAFT
  { id: "data", en: "What the data says", fr: "Ce que disent les données" },
]

// One entry per beat: its chapter, its name (tooltip on the progress line
// and screen readers only, never on the page), and its narration: one short
// thought, or nothing when the scene speaks for itself.
export const BEATS = {
  /* ---------- What matters ---------- */
  opening: {
    act: 0,
    title: {
      en: "The question asked every year",
      fr: "La question posée chaque année",
    },
    // Checked against the three methods: the wording differs (the country's
    // problems for ObSoCo and the Eurobarometer, personal concerns for Ipsos).
    text: {
      en: "Every year, thousands of people in France are asked which issues matter most. Three surveys, three ways of asking.",
      fr: "Chaque année, des milliers de personnes en France disent quels enjeux comptent le plus. Trois enquêtes, trois façons de le demander.", // FR-DRAFT
    },
  },
  question: {
    act: 0,
    title: { en: "The question", fr: "La question" },
    text: null,
  },
  answers: {
    act: 0,
    title: { en: "One answer stands out", fr: "Une réponse se détache" },
    text: null,
  },
  concerns: {
    act: 0,
    title: { en: "Shared concerns", fr: "Les préoccupations communes" },
    text: {
      en: ({ followed }) =>
        `Ten concerns recur from one survey to another. We added one. We follow ${followed}.`,
      fr: ({ followed }) =>
        `Dix préoccupations reviennent d'une enquête à l'autre. Nous en ajoutons une. Nous suivons ${followed}.`, // FR-DRAFT
    },
  },

  /* ---------- What is said ---------- */
  debates: {
    act: 1,
    title: {
      en: "One concern, several debates",
      fr: "Une préoccupation, plusieurs débats",
    },
    text: {
      en: ({ k }) => `One concern. ${k} different debates.`,
      fr: ({ k }) => `Une préoccupation. ${k} débats différents.`, // FR-DRAFT
    },
  },
  asked: {
    act: 1,
    title: { en: "The question in Parliament", fr: "La question au Parlement" },
    text: {
      en: ({ argument }) => `We follow one argument: ${argument}.`,
      fr: ({ argument }) => `Nous suivons un argument : ${argument}.`, // FR-DRAFT
    },
  },
  answered: {
    act: 1,
    title: { en: "The government answers", fr: "Le gouvernement répond" },
    text: { en: "The government answers.", fr: "Le gouvernement répond." },
  },
  checked: {
    act: 1,
    title: { en: "The argument is checked", fr: "L'argument est vérifié" },
    text: {
      en: ({ weeks }) =>
        weeks
          ? `${weeks} later, a fact-checker tests its broadest form.`
          : "Outside the chamber, fact-checkers test what is said.",
      fr: ({ weeks }) =>
        weeks
          ? `${weeks} plus tard, un fact-checkeur vérifie sa forme la plus large.`
          : "Hors de l'hémicycle, les fact-checkeurs vérifient ce qui se dit.", // FR-DRAFT
    },
  },
  travels: {
    act: 1,
    title: { en: "Beyond Parliament", fr: "Au-delà du Parlement" },
    text: {
      en: ({ line }) =>
        line || "Online, the subject travels and changes shape.",
      fr: ({ line }) =>
        line || "En ligne, le sujet circule et change de forme.", // FR-DRAFT
    },
  },

  /* ---------- What the data says ---------- */
  claim: {
    act: 2,
    title: { en: "One claim", fr: "Une affirmation" },
    text: {
      en: "Of everything said, one sentence can be tested.",
      fr: "De tout ce qui s'est dit, une phrase peut être éprouvée.", // FR-DRAFT
    },
  },
  parts: {
    act: 2,
    title: { en: "What can be measured", fr: "Ce qui se mesure" },
    text: {
      en: "What exactly can we measure?",
      fr: "Que peut-on mesurer, exactement ?",
    }, // FR-DRAFT
  },
  evidence: {
    act: 2,
    title: { en: "What the figures show", fr: "Ce que montrent les chiffres" },
    text: null, // the finding, in the scene, is the statement
  },
  ending: {
    act: 2,
    title: { en: "Continue the investigation", fr: "Poursuivre l'enquête" },
    text: null,
  },
  // Topics without a tested claim end on their first question's data
  figure: {
    act: 2,
    title: { en: "One question", fr: "Une question" },
    text: {
      en: "A question public data can answer.",
      fr: "Une question à laquelle des données publiques répondent.", // FR-DRAFT
    },
  },
  chart: {
    act: 2,
    title: { en: "Over time", fr: "Dans la durée" },
    text: { en: "Over time.", fr: "Dans la durée." },
  },
}

// The closing lines
export const ENDING = {
  tested: {
    en: "A concern becomes an argument. An argument becomes a claim. A claim becomes something we can test.",
    fr: "Une préoccupation devient un argument. Un argument devient une affirmation. Une affirmation devient quelque chose que l'on peut éprouver.", // FR-DRAFT
  },
  untested: {
    en: "A concern becomes an argument. An argument becomes a question. A question becomes something we can measure.",
    fr: "Une préoccupation devient un argument. Un argument devient une question. Une question devient quelque chose que l'on peut mesurer.", // FR-DRAFT
  },
}

// Small fixed lines, near the visuals they describe
export const NOTES = {
  // beside the one figure shown in the guided story; the full lists are in
  // "Behind the story"
  answerEB: {
    en: "of people in France named it. Up to two answers each. Standard Eurobarometer, average of autumn 2025 and spring 2026.",
    fr: "des personnes en France l'ont cité. Jusqu'à deux réponses. Eurobaromètre standard, moyenne de l'automne 2025 et du printemps 2026.",
  },
  answerIpsos: {
    en: "of people named it. Two answers each. Ipsos BVA, Fractures françaises, October 2025, 3,000 people.",
    fr: "des personnes l'ont cité. Deux réponses chacune. Ipsos BVA, Fractures françaises, octobre 2025, 3 000 personnes.",
  },
  answersEB: {
    en: "Share of respondents in France naming each issue. Up to two answers each, so the shares add up to more than 100%.",
    fr: "Part des personnes interrogées en France citant chaque enjeu. Jusqu'à deux réponses : le total dépasse 100 %.",
  },
  rule: {
    en: "Kept: issues in the top ten of at least two of the three surveys (ObSoCo–Cevipof, Ipsos BVA, Eurobarometer) over the last twelve months.",
    fr: "Retenus : les enjeux du top 10 d'au moins deux des trois enquêtes (ObSoCo–Cevipof, Ipsos BVA, Eurobaromètre) sur les douze derniers mois.",
  },
  exception: {
    en: "Education is added by choice: far more debated in Parliament than it ranks.",
    fr: "L'éducation est ajoutée par choix : bien plus débattue au Parlement que son rang ne le dit.",
  },
  unmeasured: {
    en: "Wars and the world can't be measured with the data used here.",
    fr: "Les guerres et la situation internationale ne se mesurent pas avec nos données.",
  },
  method: {
    en: "How the topics were chosen",
    fr: "Comment les sujets ont été choisis",
  },
  change: {
    en: "Or choose another concern",
    fr: "Ou choisissez une autre préoccupation",
  },
  chosen: { en: "How these were chosen", fr: "Comment elles ont été choisies" },
  angles: {
    en: "Collected texts, not survey answers. One text can touch several debates.",
    fr: "Des textes collectés, pas des réponses d'enquête. Un texte peut toucher plusieurs débats.",
  },
  translation: {
    en: "Translation: The Non Fictional",
    fr: "Traduction : The Non Fictional",
  },
  corpus: {
    en: ({ from, to, until }) =>
      `Each mark is one text collected from ${from} to ${to} (the Assemblée up to ${until}). A collected corpus, not all French political speech. One text can belong to several topics.`,
    fr: ({ from, to, until }) =>
      `Chaque trait est un texte collecté du ${from} au ${to} (l'Assemblée jusqu'au ${until}). Un corpus collecté, pas toute la parole politique française. Un texte peut appartenir à plusieurs sujets.`,
  },
  selection: {
    en: "Fact-checkers choose what to check, mostly claims that spread and look doubtful. These shares don't measure how often anyone is wrong.",
    fr: "Les fact-checkeurs choisissent ce qu'ils vérifient, surtout ce qui circule et paraît douteux. Ces parts ne mesurent pas la fréquence du faux.",
  },
  party: {
    en: "Colour: the party of each group and minister (Wikidata, completed by hand). LIOT, non-attached members and unsigned texts in grey.",
    fr: "Couleur : le parti de chaque groupe et de chaque ministre (Wikidata, complété à la main). LIOT, non-inscrits et textes non signés en gris.",
  },
}

// The thread followed by default (cost of living → fuel taxes compared with
// the neighbours): the fragment of each quote that carries the argument,
// and our translation of the quote and of the fragment.
export const THREAD_EXTRAS = {
  cost: {
    argument: { en: "fuel taxes", fr: "les taxes sur les carburants" },
    followed: { en: "the cost of living", fr: "le pouvoir d'achat" },
    question: {
      fragment: "Toute l'Europe prend des mesures dans ce sens",
      excerpt:
        "Toute l'Europe prend des mesures dans ce sens : le gouvernement espagnol a décidé, en une nuit, de baisser la TVA de 21 % à 10 % ; la Suède et l'Italie ont réduit immédiatement leur fiscalité.",
      en: "Give back at least the part of VAT that varies with prices, which you are collecting during this crisis. All of Europe is taking measures along these lines: the Spanish government decided, overnight, to cut VAT from 21% to 10%; Sweden and Italy immediately reduced their taxes.",
      excerptEn:
        "All of Europe is taking measures along these lines: the Spanish government decided, overnight, to cut VAT from 21% to 10%; Sweden and Italy immediately reduced their taxes.",
      fragmentEn: "All of Europe is taking measures along these lines",
    },
    answer: {
      role: {
        en: "government spokesperson",
        fr: "porte-parole du gouvernement",
      },
      fragment: "Vous citez l'exemple de l'Italie",
      en: "You cite the example of Italy, which has indeed decided to lower the price at the pump. But how is it paying for this discount? By cancelling funding for security, health, public services and transport.",
      fragmentEn: "You cite the example of Italy",
    },
    echo: {
      QANR5L17QG1373: {
        fragment:
          "l'Italie, l'Espagne et la Grèce ont baissé leurs taxes sur les carburants",
        fragmentEn: "Italy, Spain and Greece have cut their fuel taxes",
      },
      QANR5L17QG1374: {
        fragment:
          "baisser les taxes sur les carburants comme en Italie, en Espagne et en Suède",
        fragmentEn: "cut fuel taxes as in Italy, Spain and Sweden",
      },
    },
    factcheck: {
      en: "All our European neighbours have cut fuel taxes",
      claimant: {
        en: "Julien Odoul, RN deputy",
        fr: "Julien Odoul, député RN",
      },
    },
    social: {
      en: "Don't you get the feeling your diesel is evaporating faster than usual?",
      claimant: { en: "TikTok", fr: "TikTok" },
      line: {
        en: "Online, the subject changes shape: this post is about diesel evaporating, not taxes.",
        fr: "En ligne, le sujet change de forme : cette publication parle d'un gazole qui s'évapore, pas de taxes.", // FR-DRAFT
      },
    },
    also: {
      "https://factuel.afp.com/doc.afp.com.A2HH8WE": {
        en: "VAT on fuel can be cut to 5.5%",
      },
    },
  },
}
// A fragment is used only if it is really in the quote
export const fragmentOf = (quote, extra) =>
  extra?.fragment && quote?.includes(extra.fragment) ? extra.fragment : null

// The claim tested at the end of the cost thread, cut into what can be
// measured. Each part anchors to an exact phrase of the claim; a phrase can
// hold two questions. These are our operational choices, stated as such.
export const TEST_PARTS = {
  cost: [
    {
      text: "Tous nos voisins européens",
      q: { en: "Which countries?", fr: "Quels pays ?" },
      d: {
        en: "France's EU neighbours by land: Belgium, Germany, Italy, Luxembourg, Spain. Others aren't in the EU bulletin.",
        fr: "Les voisins terrestres de la France dans l'UE : Allemagne, Belgique, Espagne, Italie, Luxembourg. Les autres sont hors du bulletin européen.", // FR-DRAFT
      },
      head: { en: "EU neighbours by land", fr: "Voisins terrestres, UE" },
    },
    {
      text: "ont baissé",
      q: { en: "Which dates?", fr: "Quelles dates ?" },
      d: {
        en: "23 February 2026, before prices jumped, against 20 April 2026, the week of the claim.",
        fr: "Le 23 février 2026, avant la flambée, contre le 20 avril 2026, la semaine de l'affirmation.", // FR-DRAFT
      },
    },
    {
      text: "ont baissé",
      q: { en: "What counts as a cut?", fr: "Qu'est-ce qu'une baisse ?" },
      d: {
        en: "A lower tax rate. VAT moves with the price, so less tax per litre isn't enough.",
        fr: "Un taux plus bas. La TVA suit le prix : moins de taxe par litre ne suffit pas.", // FR-DRAFT
      },
      head: { en: "Rate cut?", fr: "Taux baissé ?" },
    },
    {
      text: "les taxes",
      q: { en: "Which tax?", fr: "Quelle taxe ?" },
      d: {
        en: "Excise duties and VAT, per litre.",
        fr: "Accises et TVA, par litre.", // FR-DRAFT
      },
      head: { en: "Tax per litre", fr: "Taxe par litre" },
    },
    {
      text: "sur les carburants",
      q: { en: "Which fuel?", fr: "Quel carburant ?" },
      d: {
        en: "Diesel. Petrol would need its own test.",
        fr: "Le gazole. L'essence demanderait son propre test.", // FR-DRAFT
      },
      head: { en: "of diesel", fr: "de gazole" },
    },
  ],
}

// The evidence: one finding, one chart, and depth on demand
export const FINDINGS = {
  headline: {
    en: ({ n, of, who }) =>
      `By the week of the claim, ${n} of France's ${of} EU neighbours by land had cut diesel tax rates: ${who}.`,
    fr: ({ n, of, who }) =>
      `La semaine de l'affirmation, ${n} des ${of} voisins terrestres de la France dans l'UE avaient baissé leurs taux de taxes sur le gazole : ${who}.`, // FR-DRAFT
  },
  // stays beside the chart: it changes how the rises read
  caveat: {
    en: "VAT is a share of the price, so tax per litre can rise with no rate change.",
    fr: "La TVA est une part du prix : la taxe par litre peut monter sans changement de taux.", // FR-DRAFT
  },
  labels: {
    cut: {
      en: "What counts as a tax cut?",
      fr: "Qu'est-ce qu'une baisse de taxe ?",
    },
    split: { en: "Price or policy?", fr: "Prix ou décision ?" },
    measures: { en: "Each country's measure", fr: "La mesure de chaque pays" },
    open: { en: "What this can't settle", fr: "Ce que cela ne tranche pas" },
    method: { en: "Method and sources", fr: "Méthode et sources" },
  },
  cost: {
    established: {
      en: ({ fell, rose }) =>
        `From 23 February to 20 April 2026, tax per litre of diesel fell in ${fell}. It rose in ${rose}, as in France.`,
      fr: ({ fell, rose }) =>
        `Du 23 février au 20 avril 2026, la taxe par litre de gazole a baissé ${fell}. Elle a augmenté ${rose}, comme en France.`, // FR-DRAFT
    },
    suggested: {
      en: "The falls match rate cuts decided in March (Spain: VAT and excise; Italy: excise). The rises match VAT following a higher price: at unchanged rates, the fixed part of the tax didn't move by a cent.",
      fr: "Les baisses correspondent aux taux réduits en mars (Espagne : TVA et accise ; Italie : accise). Les hausses correspondent à la TVA qui suit un prix plus élevé : à taux inchangés, la part fixe de la taxe n'a pas bougé d'un centime.", // FR-DRAFT
    },
    open: {
      en: "Whether “neighbours” should include Sweden or Greece, as cited in the chamber; whether petrol tells the same story; how much of each cut reached the pump; and whether France should have cut too. That is a political question, not a measurement.",
      fr: "Si les « voisins » doivent inclure la Suède ou la Grèce, citées dans l'hémicycle ; si l'essence raconte la même chose ; quelle part de chaque baisse a atteint la pompe ; et si la France aurait dû baisser aussi. Cela relève du débat politique, pas de la mesure.", // FR-DRAFT
    },
  },
  method: {
    en: "Tax per litre = price with taxes − price without (EU Weekly Oil Bulletin, diesel, Monday prices). The fixed part = price ÷ (1 + standard VAT rate) − price without taxes. It stays flat when no rate changes; a step means a decision, checked against each country's own texts where one was found. For Belgium and Luxembourg, “no rate change” rests on the figures.",
    fr: "Taxe par litre = prix TTC − prix hors taxes (Bulletin pétrolier hebdomadaire de l'UE, gazole, prix du lundi). Part fixe = prix ÷ (1 + taux normal de TVA) − prix hors taxes. Elle reste plate tant qu'aucun taux ne change ; une marche signale une décision, vérifiée dans les textes de chaque pays quand ils ont été trouvés. Pour la Belgique et le Luxembourg, « aucun changement de taux » repose sur les chiffres.", // FR-DRAFT
  },
}
