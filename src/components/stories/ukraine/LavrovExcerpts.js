"use client"

import * as React from "react"

import styles from "./ukraine.module.css"

// The four Lavrov excerpts, as text, in place of the image that showed them:
// the phrases the image marked underlined, each tactic its own line — Big
// Lies solid, Newspeak dotted, Misleading dashed, Whataboutism wavy — so two
// in one excerpt tell apart in one colour. A tactic chosen, by its button or
// by tapping one of its phrases, lights only its phrases and fades the
// excerpts that show none of it.
const c = (...names) => names.map(name => styles[name]).filter(Boolean).join(" ")

const TACTICS = [
  ["newspeak", "Newspeak"],
  ["lies", "Big Lies"],
  ["misleading", "Misleading information"],
  ["whataboutism", "Whataboutism"],
]
const TACTIC = Object.fromEntries(TACTICS)

// Each excerpt as runs of text; a marked run carries its tactic.
const EXCERPTS = [
  [
    "This has been happening in Donbass for eight years and is now happening during Russia’s ",
    ["special military operation", "newspeak"],
    ". The goal of this operation is ",
    ["to stop any war", "lies"],
    " that could take place on Ukrainian territory or that could start from there.",
  ],
  [
    "There is a lot of information about provocations being prepared, including in Mariupol and other places, where the Ukrainians are trying to use ",
    ["civilians as human shields", "lies"],
    ". Ask the ",
    ["Indian, Arab, or African students who are trying to leave Ukraine, but they won’t let them go", "misleading"],
    ".",
  ],
  [
    "In the final analysis, this is not just the situation in Ukraine, the efforts to ",
    ["demilitarise", "newspeak"],
    " and ",
    ["de-nazify", "newspeak"],
    " it, to prevent the continuing manifestations of ",
    ["genocide on its territory", "lies"],
    ", putting a stop to any violence and ensuring for the Ukrainians an opportunity to ",
    ["decide their destiny themselves", "lies"],
    "; no, it is the world order that is at stake.",
  ],
  [
    "We did not come up with the term “collateral damage.” Our Western colleagues came up with it during their ",
    ["reckless undertakings in Iraq", "whataboutism"],
    ", and before that in other countries such as ",
    ["Libya", "whataboutism"],
    ", and ",
    ["Latin America", "whataboutism"],
    ". Have you ever covered the developments in ",
    ["Iraq", "whataboutism"],
    " or ",
    ["Libya", "whataboutism"],
    " with the same emotional zeal? With hundreds of thousands of dead civilians? I can’t remember that.",
  ],
]
// The tactics an excerpt shows, in order of first appearance.
const tacticsOf = runs => [...new Set(runs.filter(run => Array.isArray(run)).map(run => run[1]))]

const LavrovExcerpts = () => {
  const [active, setActive] = React.useState(null)
  const [open, setOpen] = React.useState(null)
  const choose = id => {
    setActive(id)
    setOpen(null)
  }
  // Tapping a phrase chooses its tactic and names it beside the phrase;
  // tapping it again shows them all.
  const tap = (cell, run, tactic) => {
    const here = `${cell}:${run}`
    if (open === here) return choose(null)
    setActive(tactic)
    setOpen(here)
  }

  return (
    <figure className={styles.ua}>
      <div className={styles.filters} role="group" aria-label="Tactics">
        <span className={styles.filtersLabel}>Show</span>
        {[[null, "All"], ...TACTICS].map(([id, label]) => (
          <button key={label} type="button" data-tactic={id || undefined} aria-pressed={active === id} onClick={() => choose(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {EXCERPTS.map((runs, cell) => (
          <blockquote key={cell} className={styles.cell} data-faint={active && !tacticsOf(runs).includes(active) ? "true" : "false"}>
            <p className={styles.tags}>
              {tacticsOf(runs).map(tactic => (
                <span key={tactic} data-tactic={tactic} data-dim={active && active !== tactic ? "true" : "false"}>
                  {TACTIC[tactic]}
                </span>
              ))}
            </p>
            <p className={styles.words}>
              {runs.map((run, i) => {
                if (!Array.isArray(run)) return <React.Fragment key={i}>{run}</React.Fragment>
                const [text, tactic] = run
                const here = open === `${cell}:${i}`
                return (
                  <React.Fragment key={i}>
                    <mark
                      className={styles.mark}
                      data-tactic={tactic}
                      data-dim={active && active !== tactic ? "true" : "false"}
                      role="button"
                      tabIndex={0}
                      aria-expanded={here}
                      onClick={() => tap(cell, i, tactic)}
                      onKeyDown={event => {
                        if (event.key !== "Enter" && event.key !== " ") return
                        event.preventDefault()
                        tap(cell, i, tactic)
                      }}
                    >
                      {text}
                    </mark>
                    {here ? <span className={styles.pop}>{TACTIC[tactic]}</span> : null}
                  </React.Fragment>
                )
              })}
            </p>
          </blockquote>
        ))}
      </div>
      <figcaption className={styles.credit}>
        — Sergey Lavrov,{" "}
        <a href="https://www.mid.ru/en/press_service/minister_speeches/1802677/" target="_blank" rel="noopener noreferrer">
          interview
        </a>
      </figcaption>
    </figure>
  )
}

export default LavrovExcerpts
