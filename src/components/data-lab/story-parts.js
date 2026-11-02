import * as React from "react"

import { shared } from "./story-motion"
import styles from "./narrative.module.css"

// The pieces every beat of the story is built from: an editorial
// quotation, the line that says where it comes from, a fact-checker's
// verdict (always theirs, always attributed), and a disclosure for method
// and sources. One typographic system for every voice: the MP, the
// minister, the fact-checked claimant and the post.

export const day = (f, iso) =>
  f.date(iso, { day: "numeric", month: "short", year: "numeric" })
export const cut = (text, n) =>
  text.length > n ? `${text.slice(0, n).replace(/\s+\S*$/, "")}…` : text

export const GROUPS = {
  RN: "RN",
  "LFI-NFP": "LFI",
  SOC: "PS",
  ECOS: "Écologistes",
  DEM: "MoDem",
  EPR: "EPR",
  HOR: "Horizons",
  LIOT: "LIOT",
  GDR: "GDR",
  DR: "Droite républicaine",
  UDDPLR: "UDR",
  NI: "Non-inscrit",
}
export const groupName = g => GROUPS[g] || g

export const TYPE_EN = {
  Déclaration: "Speech",
  Interview: "Interview",
  Communiqué: "Press release",
  "Conférence de presse": "Press conference",
  Lettre: "Letter",
  Tribune: "Op-ed",
}

export const Ext = ({ href, children, className }) => (
  <a
    className={className || styles.ext}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
    <span aria-hidden="true"> ↗</span>
  </a>
)

/* ---------- verdicts ---------- */

// An outlet's verdict, sorted into five groups (the same rules as
// scripts/data-lab/export-texts.py)
export const VERDICTS = [
  ["f", ["Faux", "False"]],
  ["m", ["Trompeur ou plutôt faux", "Misleading or mostly false"]],
  ["x", ["Nuancé", "Mixed"]],
  ["t", ["Vrai ou plutôt vrai", "True or mostly true"]],
  ["p", ["Image ou vidéo manipulée", "Manipulated image or video"]],
]
const fold = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
export const verdictOf = rating => {
  const r = fold(rating || "")
  if (/image|video|ia\b/.test(r)) return "p"
  if (/plutot faux|trompeur|misleading|partiellement faux/.test(r)) return "m"
  if (r.startsWith("faux")) return "f"
  if (/plutot vrai|^vrai$|^true$/.test(r)) return "t"
  if (/en partie|plus complique|contexte/.test(r)) return "x"
  if (/faux|false|falsch|errone/.test(r)) return "f"
  return "x"
}
// The outlet's own label, attributed to it. In English, its exact
// translation ("Plutôt faux" is "Mostly false", not a group name).
const LABEL_EN = {
  faux: "False",
  "plutot faux": "Mostly false",
  trompeur: "Misleading",
  "plutot vrai": "Mostly true",
  "en partie vrai": "Partly true",
  vrai: "True",
  "manque de contexte/partiellement faux": "Missing context / partly false",
  "c'est plus complique": "It's more complicated",
  "image generee par ia": "AI-generated image",
  "image manipulee": "Manipulated image",
  "video manipulee": "Manipulated video",
  "faux et manque de contexte": "False and missing context",
  errone: "Wrong",
  "contexte manquant": "Missing context",
  falsch: "False",
  false: "False",
  misleading: "Misleading",
}
const LABEL_FR = { falsch: "Faux", false: "Faux", misleading: "Trompeur" }
export const ratingLabel = (rating, lang) => {
  const k = fold(rating || "").replace(/[’']/g, "'")
  return (lang === "fr" ? LABEL_FR[k] : LABEL_EN[k]) || rating
}

// "False, according to TF1 Info": the label beside its verdict colour, the
// attribution in plain ink. Never a stamp: it is reported, not ruled.
export const Verdict = ({ rating, publisher, url, date, f }) => (
  <span className={styles.verdict} data-v={verdictOf(rating)}>
    <i aria-hidden="true" />
    <b>{ratingLabel(rating, f.lang)}</b>
    <span>
      {f.L([", selon ", ", according to "])}
      {url ? <Ext href={url}>{publisher}</Ext> : publisher}
      {date ? ` · ${day(f, date)}` : ""}
    </span>
  </span>
)

/* ---------- quotations ---------- */

// Where a statement comes from: who, in what capacity, when, and the
// document itself. Small, neutral, in the functional face.
export const SourceLine = ({ who, role, date, where, url, link, f }) => (
  <span className={styles.source}>
    {who ? <b>{who}</b> : null}
    {role ? <span>{role}</span> : null}
    {date ? <span>{day(f, date)}</span> : null}
    {url ? (
      <Ext href={url}>{link || where}</Ext>
    ) : where ? (
      <span>{where}</span>
    ) : null}
  </span>
)

// An editorial quotation. One language at a time: the reader's language by
// default (in English, our translation, labelled as ours), the original
// words one click away. In French, the original. When an excerpt is given
// (and really is in the quote), the excerpt shows with its ellipses and the
// whole quotation is one click away.
//   size: "xl" | "l" | "m" | "s"
export const Quote = ({
  text,
  lang = "fr",
  excerpt,
  translation,
  excerptTranslation,
  size = "l",
  cite,
  name,
  f,
  children,
}) => {
  const [whole, setWhole] = React.useState(false)
  const [original, setOriginal] = React.useState(false)
  const usable = excerpt && text.includes(excerpt) && excerpt !== text
  const showExcerpt = usable && !whole
  const foreign = f.lang !== lang
  // no translation of the part on show: the original is what we have
  const tr = foreign
    ? showExcerpt
      ? excerptTranslation || null
      : translation || null
    : null
  const translated = !!tr && !original
  const fromOriginal = showExcerpt
    ? `${text.startsWith(excerpt) ? "" : "[…] "}${excerpt}${text.endsWith(excerpt) ? "" : " […]"}`
    : text
  const fromTranslation =
    showExcerpt && tr
      ? `${text.startsWith(excerpt) ? "" : "[…] "}${tr}${text.endsWith(excerpt) ? "" : " […]"}`
      : tr
  const words = translated ? fromTranslation : fromOriginal
  const shownLang = translated ? f.lang : lang
  return (
    <figure className={`${styles.quote} ${styles[`q_${size}`]}`}>
      <blockquote
        lang={shownLang}
        className={styles.quoteText}
        style={shared(name)}
      >
        <span aria-hidden="true" className={styles.quoteMark}>
          {shownLang === "fr" ? "« " : "“"}
        </span>
        {words}
        <span aria-hidden="true" className={styles.quoteMark}>
          {shownLang === "fr" ? " »" : "”"}
        </span>
      </blockquote>
      <figcaption className={styles.quoteCite}>
        {cite ? <SourceLine {...cite} f={f} /> : null}
        {children}
        {tr || usable ? (
          <span className={styles.quoteTools}>
            {tr ? (
              <>
                {translated ? <span>Our translation</span> : null}
                <button
                  type="button"
                  className={styles.expand}
                  aria-pressed={original}
                  onClick={() => setOriginal(o => !o)}
                >
                  {translated ? "Original French" : "English"}
                </button>
              </>
            ) : null}
            {usable ? (
              <button
                type="button"
                className={styles.expand}
                aria-expanded={whole}
                onClick={() => setWhole(w => !w)}
              >
                {whole
                  ? f.L(["L'extrait", "Excerpt"])
                  : f.L(["Citation entière", "Full quotation"])}
              </button>
            ) : null}
          </span>
        ) : null}
      </figcaption>
    </figure>
  )
}

/* ---------- method and sources ---------- */

// Method, sources and limits stay one click from the evidence they
// qualify, without taking its place.
export const Disclosure = ({ label, children, className }) => (
  <details className={`${styles.disclosure} ${className || ""}`}>
    <summary>{label}</summary>
    <div className={styles.disclosureBody}>{children}</div>
  </details>
)
