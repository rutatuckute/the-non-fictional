"use client"

import * as React from "react"

import { Glyph } from "../redesign/FieldKey"
import { makeFormat } from "./format"
import Methodology from "./methodology"
import StateOfThings from "./state-of-things"
import styles from "./data-lab.module.css"

// Every line of the page in both languages. French is the default: the lab is
// about France and most of its sources are French.
const STRINGS = {
  fr: {
    label: "Data\u00a0Lab · France · Automne\u00a02026",
    title: [
      "France\u00a0: au-\u2060delà des récits.",
      "Les données, telles quelles.",
    ],
    lead: "Une tentative de cartographier l'état des choses au-delà des convictions préexistantes et des récits concurrents. Non pas les données comme vérité absolue (attention, spoiler : elles aussi se manipulent), mais comme un humble point de départ : ce que montrent les données et d'où elles viennent.",
    toggle: "Langue",
  },
  en: {
    label: "Data\u00a0Lab · France · Autumn\u00a02026",
    title: ["France: beyond narratives.", "Data, as is."],
    lead: "An attempt to map the state of things beyond preexisting convictions and competing narratives. Not data as absolute truth (spoiler alert: it can be manipulated too), but as a humble starting point: what the data shows and where it comes from.",
    toggle: "Language",
  },
}

// English first in the toggle; French stays the default (the lab is about
// France and most of its sources are French).
const LANGS = ["en", "fr"]

const SECTIONS = [
  ["#state", "01", ["L'état des choses", "The state of things"]],
  [null, "02", ["Ce qui se passe", "What is happening"]],
  [
    null,
    "03",
    ["Discours public et attention", "Public discourse and attention"],
  ],
  ["#method", null, ["Méthode et sources", "Method and sources"]],
]

export default function DataLab() {
  const [lang, setLang] = React.useState("fr")
  const t = STRINGS[lang]
  const f = React.useMemo(() => makeFormat(lang), [lang])

  // The language lives in the address (?lang=en), so a shared link opens in
  // the language it was read in. Read once on arrival, rewritten on change.
  React.useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("lang")
    if (LANGS.includes(requested)) setLang(requested)
  }, [])

  const choose = next => {
    setLang(next)
    const url = new URL(window.location.href)
    if (next === "fr") url.searchParams.delete("lang")
    else url.searchParams.set("lang", next)
    window.history.replaceState(null, "", url)
  }

  return (
    <main className={styles.lab} lang={lang}>
      <header className={styles.head}>
        <div className={styles.topline}>
          <span className={styles.label}>
            <svg
              className={styles.mark}
              viewBox="-10 -10 20 20"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <Glyph format="data" />
            </svg>
            {t.label}
          </span>
          <div className={styles.toggle} role="group" aria-label={t.toggle}>
            {LANGS.map(code => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={lang === code}
                onClick={() => choose(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {/* Title and lead on the left, the page's sections on the right. */}
        <div className={styles.intro}>
          <div>
            {/* Two beats, each on its own line at every width. */}
            <h1 className={styles.title}>
              {t.title.map(line => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className={styles.lead}>{t.lead}</p>
          </div>
          {/* The page's sections, as the mockup set them. Sections not built
              yet are listed but not linked. */}
          <nav
            className={styles.sections}
            aria-label={f.L(["Sections", "Sections"])}
          >
            {SECTIONS.map(([href, n, label]) =>
              href ? (
                <a key={label[1]} className={styles.section} href={href}>
                  {n ? <span className={styles.sectionNo}>{n}</span> : null}
                  {f.L(label)}
                </a>
              ) : (
                <span
                  key={label[1]}
                  className={`${styles.section} ${styles.isSoon}`}
                >
                  {n ? <span className={styles.sectionNo}>{n}</span> : null}
                  {f.L(label)}
                  <span className={styles.soon}>
                    {f.L(["à venir", "to come"])}
                  </span>
                </span>
              ),
            )}
          </nav>
        </div>
      </header>

      <StateOfThings f={f} />

      <Methodology f={f} />
    </main>
  )
}
