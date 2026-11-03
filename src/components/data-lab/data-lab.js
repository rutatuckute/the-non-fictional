"use client"

import * as React from "react"

import { Glyph } from "../redesign/FieldKey"
import { makeFormat } from "./format"
import Methodology from "./methodology"
import StateOfThings from "./state-of-things"
import styles from "./data-lab.module.css"

// Every line of the page in both languages. English is the default.
const STRINGS = {
  fr: {
    label: "Data\u00a0Lab · France · Automne\u00a02026",
    title: [
      "France\u00a0:",
      "Au-\u2060delà des récits. Les données, telles quelles.",
    ],
    lead: [
      "Une tentative de cartographier la France au-delà des récits concurrents, avec les données comme point de départ plutôt que comme vérité (",
      "attention, spoiler",
      "\u00a0: elles aussi se manipulent).",
      "Les chiffres confirment-ils les arguments que l'on entend\u00a0?",
    ],
    toggle: "Langue",
  },
  en: {
    label: "Data\u00a0Lab · France · Autumn\u00a02026",
    title: ["France:", "Beyond narratives. Data, as is."],
    lead: [
      "An attempt to map France beyond competing narratives, with data as a starting point rather than a truth (",
      "spoiler alert",
      ": it can be manipulated too).",
      "Do the figures support the arguments we hear?",
    ],
    toggle: "Language",
  },
}

// English first in the toggle, and the default when the address names no
// language.
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
  const [lang, setLang] = React.useState("en")
  const t = STRINGS[lang]
  const f = React.useMemo(() => makeFormat(lang), [lang])

  // The language lives in the address (?lang=en or ?lang=fr), so a shared link
  // opens in the language it was read in. Read once on arrival, written on
  // change, whichever language is chosen.
  React.useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("lang")
    if (LANGS.includes(requested)) setLang(requested)
  }, [])

  const choose = next => {
    setLang(next)
    const url = new URL(window.location.href)
    url.searchParams.set("lang", next)
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
        <h1 className={styles.title}>
          <span className={styles.titleMain}>{t.title[0]}</span>
          <span className={styles.titleSub}>{t.title[1]}</span>
        </h1>
        {/* The lead on the left, the page's sections on the right. */}
        <div className={styles.intro}>
          <p className={styles.lead}>
            {t.lead[0]}
            <span className={styles.spoiler}>{t.lead[1]}</span>
            {t.lead[2]} <span className={styles.leadQuestion}>{t.lead[3]}</span>
          </p>
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
