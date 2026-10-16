"use client"

import styles from "./belarus.module.css"

// The key players of the 2020 election, set as a ballot in place of the
// image that showed them: four names, three struck off with what became of
// them, one box ticked. The engravings are the author's own.
const PLAYERS = [
  {
    id: "tikhanouski",
    name: "Siarhei Tikhanouski",
    role: "Blogger",
    fate: [
      ["rejected", "Registration rejected due to alleged violation of the submission procedure"],
      ["arrested", "Arrested & facing criminal charges"],
    ],
  },
  {
    id: "babaryka",
    name: "Viktar Babaryka",
    role: "Formerly head of Belgazprombank",
    fate: [
      ["rejected", "Registration rejected due to alleged inconsistency in submitting income & property declaration"],
      ["arrested", "Arrested & facing criminal charges on tax evasion & money laundering"],
    ],
  },
  {
    id: "tsepkalo",
    name: "Valery Tsepkalo",
    role: "Ex-ambassador to the US, founder of High Tech Park",
    fate: [["rejected", "Disqualified as the majority of signatures were invalidated"]],
  },
  {
    id: "tikhanovskaya",
    name: "Sviatlana Tikhanovskaya",
    role: "Wife of Siarhei Tikhanouski",
    fate: [["registered", "Officially registered candidate"]],
    standing: true,
  },
]

// What befell each: rejected (a barred circle), arrested (handcuffs),
// registered (a tick).
const Mark = ({ kind }) => (
  <svg className={styles.icon} data-kind={kind} viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    {kind === "rejected" ? (
      <>
        <circle cx="10" cy="10" r="8" />
        <line x1="5.5" y1="10" x2="14.5" y2="10" />
      </>
    ) : kind === "arrested" ? (
      <>
        <circle cx="6" cy="11.5" r="4" />
        <circle cx="14" cy="11.5" r="4" />
        <path d="M6 7.5 C 7 4.5, 13 4.5, 14 7.5" />
      </>
    ) : (
      <path d="M4 10.5 L8.5 15 L16.5 5.5" />
    )}
  </svg>
)

const KeyPlayersBallot = () => (
  <figure className={styles.by}>
    <div className={styles.ballot}>
      <p className={styles.ballotHead}>
        <span>Presidential election · 9 August 2020</span>
        <span>The opposition’s candidates</span>
      </p>
      <ol className={styles.rows}>
        {PLAYERS.map(p => (
          <li key={p.id} className={styles.row} data-standing={p.standing ? "true" : "false"}>
            <span className={styles.box} aria-hidden="true">{p.standing ? <Mark kind="registered" /> : null}</span>
            <img className={styles.portrait} src={`/images/stories/belarus/${p.id}.webp`} alt="" width="96" height="112" loading="lazy" decoding="async" />
            <div className={styles.who}>
              <p className={styles.name}>
                {p.standing ? p.name : <del>{p.name}</del>}
              </p>
              <p className={styles.role}>{p.role}</p>
            </div>
            <ul className={styles.fate}>
              {p.fate.map(([kind, text]) => (
                <li key={kind} data-kind={kind}>
                  <Mark kind={kind} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  </figure>
)

export default KeyPlayersBallot
