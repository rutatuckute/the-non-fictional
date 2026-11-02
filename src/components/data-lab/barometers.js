// The three barometers the topics come from: who runs each, how it asks, the
// waves used and where their figures are published. Shared by the method
// section's pipeline, its flow and its barometer-by-barometer grid.

export const BAROMETERS = {
  obsoco: {
    name: "Priorités françaises",
    short: "Priorités",
    by: "L'ObSoCo · Cevipof",
    kind: ["Question ouverte", "Open question"],
    question:
      "« Quel est selon vous le problème LE PLUS IMPORTANT auquel le pays est confronté aujourd'hui ? »",
    answers: [
      "Jusqu'à deux réponses, dans les mots des répondants",
      "Up to two answers, in respondents' own words",
    ],
    sample: ["2 000 personnes par vague", "2,000 people per wave"],
    waves: {
      1: ["sept. 2025", "Sep 2025"],
      2: ["déc. 2025", "Dec 2025"],
      3: ["mars 2026", "Mar 2026"],
      4: ["juin 2026", "Jun 2026"],
      5: ["sept. 2026", "Sep 2026"],
    },
    url: "https://www.sciencespo.fr/cevipof/fr/etudes-enquetes/barometre-priorites-francaises-l-ob-so-co-cevipof/",
    sources: [
      [
        [
          "Note de juillet 2026, p. 2 · vagues 1 à 4",
          "July 2026 note, p. 2 · waves 1 to 4",
        ],
        "https://www.sciencespo.fr/cevipof/sites/sciencespo.fr.cevipof/files/ObSoCo_CEVIPOF_MIP_juillet26_vague3et4.pdf",
      ],
      [
        [
          "Note d'octobre 2026, p. 2 · vague 5",
          "October 2026 note, p. 2 · wave 5",
        ],
        "https://www.sciencespo.fr/cevipof/files/ObSoCo_CEVIPOF_MIP_oct26_vague5.pdf",
      ],
    ],
    note: [
      "Seul le top 10 de chaque vague est publié : un sujet absent d'une vague y pèse entre 0 et la 10e valeur.",
      "Only each wave's top 10 is published: a topic missing from a wave counts between 0 and that wave's 10th value.",
    ],
  },
  fractures: {
    name: "Fractures françaises",
    short: "Fractures",
    by: "Ipsos bva · Le Monde, Cevipof, Fondation Jean-Jaurès, Institut Montaigne",
    kind: ["Liste fermée", "Closed list"],
    question:
      "« Parmi les enjeux suivants, quels sont les deux qui vous préoccupent le plus à titre personnel ? »",
    answers: ["Deux réponses parmi 14", "Two answers out of 14"],
    sample: ["3 000 personnes", "3,000 people"],
    waves: { 13: ["oct. 2025", "Oct 2025"] },
    url: "https://www.ipsos.com/fr-fr/fractures-francaises-2025",
    sources: [
      [
        ["Rapport complet, p. 13", "Full report, p. 13"],
        "https://www.ipsos.com/sites/default/files/ct/news/documents/2025-10/ipsos-bva-fractures-francaises-2025-rapport-complet.pdf",
      ],
    ],
  },
  eurobarometer: {
    name: "Eurobaromètre standard",
    short: "Eurobaro.",
    by: "Commission européenne · France",
    kind: ["Liste fermée", "Closed list"],
    question:
      "« What do you think are the two most important issues facing (OUR COUNTRY) at the moment? »",
    answers: ["Deux réponses parmi 15", "Two answers out of 15"],
    sample: null,
    waves: {
      104: ["oct.-nov. 2025", "Oct-Nov 2025"],
      105: ["mars-avr. 2026", "Mar-Apr 2026"],
    },
    url: "https://europa.eu/eurobarometer/screen/home",
    sources: [
      [
        [
          "Annexe de données EB105, QA3, p. 41 et 43",
          "EB105 data annex, QA3, pp. 41 and 43",
        ],
        "https://euneighbourseast.eu/wp-content/uploads/2026/05/standard-eurobarometer-105-spring-2026_data-annex_en.pdf",
      ],
    ],
    note: [
      "La vague d'automne 2025 est déduite de la colonne « évolution » de celle du printemps 2026.",
      'The autumn 2025 wave is derived from the spring 2026 wave\'s "change" column.',
    ],
  },
}
export const ORDER = ["obsoco", "fractures", "eurobarometer"]
