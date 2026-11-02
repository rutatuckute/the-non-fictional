import * as React from "react"

import THREADS from "./data/threads.json"
import { THREAD_EXTRAS, fragmentOf, say } from "./story-copy"
import { shared } from "./story-motion"
import { Quote, Verdict, cut, day, groupName } from "./story-parts"
import styles from "./narrative.module.css"

// What is said, made concrete. The argument in the chamber (the question,
// then the answer, as a shot and its reverse shot: the same room seen from
// the benches, then from the government's side), then checked by a
// fact-checker, then a detour to social media, where a post comes out of the
// phone. What the reader was looking at stays in view as the scene changes; the
// rest is in "Behind the story".

const CHAMBER = {
  asked: {
    src: "/images/data-lab/chamber-mps.webp",
    alt: [
      "Gravure : une députée, de dos, interpelle le gouvernement depuis les bancs de l'hémicycle ; à la tribune, un ministre lui fait face.",
      "Engraving: an MP, seen from behind, questions the government from the benches of the chamber; at the tribune a minister faces her.",
    ],
  },
  answered: {
    src: "/images/data-lab/chamber-government.webp",
    alt: [
      "Gravure : un ministre, de dos, répond depuis le banc du gouvernement à une députée debout dans les travées.",
      "Engraving: a minister, seen from behind, answers from the government bench to an MP standing among the benches.",
    ],
  },
}
// The scenes are reconstructed: named as illustrations, discreetly
const Illustration = ({ f }) => (
  <figcaption className={styles.illustration}>
    {f.L(["Illustration", "Illustration"])}
  </figcaption>
)

// The question carried into the answer: a few of its words, in the reader's
// language, so the reply is visibly a reply
const Asked = ({ th, x, f }) => {
  const q = th.qag
  const en = f.lang !== "fr" && x.question?.fragmentEn
  const piece = en || fragmentOf(q.question, x.question) || cut(q.question, 90)
  return (
    <p className={styles.asked} lang={en ? "en" : "fr"} style={shared("doc-q")}>
      <span>
        {en ? "“" : "« "}
        {piece}
        {en ? "…”" : " … »"}
      </span>
      <small>
        {q.deputy}, {groupName(q.group)}
      </small>
    </p>
  )
}

export const Chamber = ({ topic, mode, line, f }) => {
  const th = THREADS[topic]
  const x = THREAD_EXTRAS[topic] || {}
  if (!th) return null
  const q = th.qag
  const c = mode === 0 ? CHAMBER.asked : CHAMBER.answered
  const source = f.L(["La séance", "The session"])
  return (
    <div className={styles.chamber} data-mode={mode}>
      <figure className={styles.chamberImg} style={shared("scene-img")}>
        <img src={c.src} alt={f.L(c.alt)} />
        <Illustration f={f} />
      </figure>
      <div className={styles.chamberWords}>
        <p className={styles.lead}>{line}</p>
        {mode === 0 ? (
          <Quote
            name="doc-q"
            text={q.question}
            excerpt={x.question?.excerpt}
            translation={x.question?.en}
            excerptTranslation={x.question?.excerptEn}
            size="l"
            f={f}
            cite={{
              who: q.deputy,
              role: groupName(q.group),
              date: q.date,
              url: q.url,
              link: source,
            }}
          />
        ) : (
          <>
            <Asked th={th} x={x} f={f} />
            <Quote
              name="doc-a"
              text={q.answer}
              translation={x.answer?.en}
              size="l"
              f={f}
              cite={{
                who: q.minister,
                role: x.answer?.role
                  ? say(f, x.answer.role)
                  : f.lang === "fr"
                    ? cut(q.ministerTitle, 50)
                    : null,
                date: q.date,
                url: q.url,
                link: source,
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

export const Checked = ({ topic, line, f, onMore }) => {
  const th = THREADS[topic]
  const x = THREAD_EXTRAS[topic] || {}
  const fc = th?.factcheck
  if (!fc) return null
  return (
    <div className={styles.checked}>
      <figure className={styles.checkedImg} style={shared("scene-img")}>
        <img
          src="/images/data-lab/fact-checker.webp?v=3"
          alt={f.L([
            "Gravure : une fact-checkeuse examine un document à la loupe, à un bureau couvert de papiers.",
            "Engraving: a fact-checker examines a document through a magnifying glass, at a desk covered with papers.",
          ])}
          width="900"
          height="1125"
        />
        <Illustration f={f} />
      </figure>
      <div className={styles.checkedWords}>
        <p className={styles.lead}>{line}</p>
        <Quote
          name={th.test ? "doc-claim" : null}
          text={fc.claim}
          translation={x.factcheck?.en}
          size="l"
          f={f}
          cite={{
            who: x.factcheck?.claimant
              ? say(f, x.factcheck.claimant)
              : fc.claimant,
            date: fc.date,
          }}
        >
          <Verdict
            rating={fc.rating}
            publisher={fc.publisher}
            url={fc.url}
            f={f}
          />
        </Quote>
        {onMore ? (
          <button type="button" className={styles.expand} onClick={onMore}>
            {f.L(["Les autres vérifications", "The other fact-checks"])} →
          </button>
        ) : null}
      </div>
    </div>
  )
}

const PLATFORMS = {
  tiktok: "TikTok",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
}

// A detour: another claim around the same concern. The post comes out of the
// phone, an ivory slip, the only light object in the story, opening from the
// screen. The tax claim stays in view, small, and comes back as the phone
// recedes.
export const Travels = ({ topic, line, f }) => {
  const th = THREADS[topic]
  const x = THREAD_EXTRAS[topic] || {}
  const s = th?.social
  if (!s) return null
  const en = f.lang !== "fr" && x.factcheck?.en
  return (
    <div className={styles.travels}>
      <figure className={styles.phoneImg} style={shared("phone")}>
        <img
          src="/images/data-lab/phone.webp"
          alt={f.L([
            "Gravure : une main tient un téléphone ouvert sur des applications de réseaux sociaux.",
            "Engraving: a hand holds a phone open on its social media apps.",
          ])}
          width="900"
          height="1125"
        />
      </figure>
      <div className={styles.travelsWords}>
        <p className={styles.lead}>{line}</p>
        <div className={styles.post}>
          <span className={styles.postHead}>
            <b>
              {PLATFORMS[s.platform] ||
                f.L(["Réseaux sociaux", "Social media"])}
            </b>
            {x.social?.claimant ? null : ` · ${s.claimant}`} · {day(f, s.date)}
          </span>
          <Quote text={s.claim} translation={x.social?.en} size="m" f={f}>
            <Verdict
              rating={s.rating}
              publisher={s.publisher}
              url={s.url}
              f={f}
            />
          </Quote>
        </div>
        {th.test && x.stillOpen ? (
          <p className={styles.stillOpen}>
            <small>{say(f, x.stillOpen)}</small>
            <span lang={en ? "en" : "fr"} style={shared("doc-claim")}>
              {en ? `“${en}”` : `« ${th.factcheck.claim} »`}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
