import * as React from "react"

import ORIGINS from "./data/origins.json"
import SPEAKERS from "./data/speakers.json"
import TEXTS from "./data/texts.json"
import THREADS from "./data/threads.json"
import { NOTES, say } from "./story-copy"
import { still, useWidth } from "./story-motion"
import {
  Ext,
  GROUPS,
  TYPE_EN,
  VERDICTS,
  Verdict,
  cut,
  day,
} from "./story-parts"
import { TOPICS } from "./topics"
import styles from "./narrative.module.css"

// The broader discourse: every collected text on the followed concern as
// one mark (questions to the government in the Assemblée, government
// statements, fact-checked claims). One set of marks, three lenses: by
// date, by who speaks, by verdict. Switching lens moves the same marks to
// new places (a transform each, so the move stays on the compositor); a
// mark is the same text in every lens. The thread followed so far stays
// outlined in terracotta. Hover, tap or the arrow keys read a mark; the
// "List" links open every text of a source.
//
// The texts are fetched per topic (public/data-lab/texts/, written by
// scripts/data-lab/export-texts.py); the counts are bundled, so the
// narration and the marks agree before anything loads.

/* ---------- the texts ---------- */

const LOADED = {}
const LOADING = {}
export const loadTexts = topic => {
  LOADING[topic] ||= fetch(`/data-lab/texts/${topic}.json`)
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(data => (LOADED[topic] = data))
    .catch(e => {
      delete LOADING[topic]
      throw e
    })
  return LOADING[topic]
}
const useTopicTexts = topic => {
  const [doc, setDoc] = React.useState(() => ({
    topic,
    data: LOADED[topic] || null,
  }))
  React.useEffect(() => {
    if (LOADED[topic]) {
      setDoc({ topic, data: LOADED[topic] })
      return undefined
    }
    let live = true
    loadTexts(topic)
      .then(data => live && setDoc({ topic, data }))
      .catch(() => live && setDoc({ topic, data: "error" }))
    return () => {
      live = false
    }
  }, [topic])
  return doc.topic === topic ? doc.data : null
}

const SOURCES = [
  {
    kind: "p",
    label: ["questions au gouvernement", "questions to the government"],
    short: ["Assemblée", "Assemblée"],
    who: ["Assemblée nationale", "Assemblée nationale"],
  },
  {
    kind: "g",
    label: ["déclarations du gouvernement", "government statements"],
    short: ["Gouvernement", "Government"],
    who: ["vie-publique.fr", "vie-publique.fr"],
  },
  {
    kind: "f",
    label: ["affirmations vérifiées", "fact-checked claims"],
    short: ["Fact-checks", "Fact-checks"],
    who: ["Fact-checkeurs", "Fact-checkers"],
  },
]
const capital = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const readText = (doc, kind, row) => {
  const S = i => doc.strings[i]
  if (kind === "p") {
    const [date, who, group, to, subject, id] = row
    return {
      date,
      who: S(who),
      group: S(group),
      to: S(to),
      subject,
      url: `https://www.assemblee-nationale.fr/dyn/17/questions/${id}`,
    }
  }
  if (kind === "g") {
    const [date, who, role, type, media, subject, path] = row
    return {
      date,
      who: S(who),
      role: S(role),
      type: S(type),
      media: S(media),
      subject,
      url: `https://www.vie-publique.fr/discours/${path}`,
    }
  }
  const [date, claim, who, by, source, verdict] = row
  return { date, claim, who: S(who), by, source, verdict }
}

// What a text is, when, who, what about, and where to read it
const TextCard = ({ kind, x, f }) => {
  const d = day(f, x.date)
  if (kind === "p")
    return (
      <>
        <span className={styles.cardKicker}>
          {f.L(["Question au gouvernement", "Question to the government"])} ·{" "}
          {d}
        </span>
        <span className={styles.cardTitle} lang="fr">
          {capital(x.subject)}
        </span>
        <span className={styles.cardMeta}>
          {x.who || f.L(["Député", "MP"])}
          {x.group ? ` · ${GROUPS[x.group] || x.group}` : ""}
          {x.to ? ` → ${x.to}` : ""}
        </span>
        <Ext href={x.url}>
          {f.L([
            "La séance sur assemblee-nationale.fr",
            "The session on assemblee-nationale.fr",
          ])}
        </Ext>
      </>
    )
  if (kind === "g")
    return (
      <>
        <span className={styles.cardKicker}>
          {[f.lang === "fr" ? x.type : TYPE_EN[x.type] || x.type, x.media, d]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className={styles.cardTitle} lang="fr">
          {cut(x.subject, 170)}
        </span>
        <span className={styles.cardMeta}>
          {x.role ? `${x.who}, ${cut(x.role, 80)}` : x.who}
        </span>
        <Ext href={x.url}>
          {f.L(["Le texte sur vie-publique.fr", "The text on vie-publique.fr"])}
        </Ext>
      </>
    )
  return (
    <>
      <span className={styles.cardKicker}>
        {f.L(["Affirmation vérifiée", "Fact-checked claim"])} · {d}
      </span>
      <span className={styles.cardTitle} lang="fr">
        « {cut(x.claim, 200)} »
      </span>
      <span className={styles.cardMeta}>
        {x.who || f.L(["Auteur non précisé", "Author not given"])}
      </span>
      <span className={styles.cardVerdicts}>
        {x.by.map(([outlet, url, rating]) => (
          <Verdict
            key={url}
            rating={rating}
            publisher={outlet}
            url={url}
            f={f}
          />
        ))}
      </span>
    </>
  )
}
const describe = (kind, x, f) =>
  kind === "p"
    ? `${f.L(["Question au gouvernement", "Question to the government"])}, ${day(f, x.date)}, ${x.who} (${GROUPS[x.group] || x.group}) : ${x.subject}`
    : kind === "g"
      ? `${x.type}, ${day(f, x.date)}, ${x.who} : ${x.subject}`
      : `${f.L(["Affirmation vérifiée", "Fact-checked claim"])}, ${day(f, x.date)}, ${x.who || ""} : ${x.claim}`

// The list of a source's texts, most recent first, in a dialog: a side
// panel (a bottom sheet on phones). Focus stays inside; Esc closes it.
const TextSheet = ({ open, topic, doc, f, onClose }) => {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const b = open && SOURCES.find(x => x.kind === open.kind)
  const rows = b && doc && doc !== "error" ? doc[b.kind] : []
  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby="corpus-sheet-title"
      onClose={onClose}
      onClick={e => e.target === ref.current && ref.current.close()}
      onKeyDown={e => e.stopPropagation()}
    >
      {b && (
        <>
          <div className={styles.sheetHead}>
            <div>
              <h3 id="corpus-sheet-title" className={styles.sheetTitle}>
                {f.num(TEXTS.topics[topic][b.kind])} {f.L(b.label)}
              </h3>
              <span className={styles.sheetSub}>
                {f.L(TOPICS[topic].name)} · {f.L(b.who)} ·{" "}
                {f.L(["les plus récents d'abord", "most recent first"])}
              </span>
            </div>
            <button
              type="button"
              className={styles.sheetClose}
              aria-label={f.L(["Fermer", "Close"])}
              onClick={() => ref.current.close()}
            >
              ×
            </button>
          </div>
          {doc === "error" ? (
            <p className={styles.sheetNote}>
              {f.L([
                "Les textes n'ont pas pu être chargés.",
                "The texts could not be loaded.",
              ])}
            </p>
          ) : !doc ? (
            <p className={styles.sheetNote}>
              {f.L(["Chargement…", "Loading…"])}
            </p>
          ) : (
            <ol className={styles.sheetList}>
              {rows
                .map((row, i) => [readText(doc, b.kind, row), i])
                .reverse()
                .map(([x, i]) => (
                  <li key={i} className={styles.sheetItem}>
                    <TextCard kind={b.kind} x={x} f={f} />
                  </li>
                ))}
            </ol>
          )}
        </>
      )}
    </dialog>
  )
}

/* ---------- who speaks ---------- */

const SEATING = [
  "LFI-NFP",
  "GDR",
  "ECOS",
  "SOC",
  "LIOT",
  "DEM",
  "EPR",
  "HOR",
  "DR",
  "UDDPLR",
  "RN",
  "NI",
]
const PARTY_GROUPS = [
  "LFI-NFP",
  "GDR",
  "SOC",
  "ECOS",
  "EPR",
  "DEM",
  "HOR",
  "DR",
  "UDDPLR",
  "RN",
]
const partyOf = g => (PARTY_GROUPS.includes(g) ? g : "other")
const speakerParty = name => SPEAKERS.speakers[name]?.party || "other"
const CLAIMANTS = [
  ["s", ["Publications anonymes", "Anonymous posts"]],
  [
    "n",
    ["Personnes ou organisations nommées", "Named people or organisations"],
  ],
  ["u", ["Auteur non précisé", "Author not given"]],
]
// groups of indexes, in display order: [{ key, label, party?, items }]
const groupsOf = (doc, kind, lens, f) => {
  const S = i => doc.strings[i]
  const rows = doc[kind]
  const collect = (keyOf, order) =>
    order
      .map(([k, label, extra]) => ({
        key: k,
        label,
        ...extra,
        items: rows
          .map((r, i) => [keyOf(r), i])
          .filter(([x]) => x === k)
          .map(([, i]) => i),
      }))
      .filter(g => g.items.length)
  if (lens === "verdict" && kind === "f")
    return collect(
      r => r[5],
      VERDICTS.map(([k, l]) => [k, f.L(l), { v: k }]),
    )
  if (kind === "p")
    return collect(
      r => S(r[2]) || "NI",
      SEATING.map(g => [g, GROUPS[g] || g, { party: partyOf(g) }]),
    )
  if (kind === "g") {
    const tally = {}
    for (const r of rows) tally[S(r[1])] = (tally[S(r[1])] || 0) + 1
    const top = Object.keys(tally)
      .sort((a, b) => tally[b] - tally[a])
      .slice(0, 4)
    return collect(
      r => (top.includes(S(r[1])) ? S(r[1]) : "*"),
      [
        ...top.map(w => [w, w, { party: speakerParty(w) }]),
        ["*", f.L(["Autres voix", "Other voices"]), { party: "other" }],
      ],
    )
  }
  return collect(
    r => r[4],
    CLAIMANTS.map(([k, l]) => [k, f.L(l)]),
  )
}

/* ---------- layouts ---------- */

// Every lens returns, for each mark key ("p12"), its place and size, and
// the labels that go with it. Sizes are chosen so the lens fits the stage.
const GAP = 2
const months = (from, to) => {
  const out = []
  let [y, m] = from.split("-").map(Number)
  const [y2, m2] = to.split("-").map(Number)
  while (y < y2 || (y === y2 && m <= m2)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

const byDate = (doc, W, H, f) => {
  const ms = months(ORIGINS.window[0], ORIGINS.window[1])
  const narrow = W < 560
  const labelW = narrow ? 0 : 128
  const colW = (W - labelW) / ms.length
  const counts = SOURCES.map(({ kind }) => {
    const c = Object.fromEntries(ms.map(m => [m, 0]))
    for (const r of doc[kind])
      if (r[0].slice(0, 7) in c) c[r[0].slice(0, 7)] += 1
    return Math.max(1, ...Object.values(c))
  })
  const head = narrow ? 18 : 0
  let s = narrow ? 6 : 11
  let fit
  for (; s >= 3; s -= 0.5) {
    const step = s + GAP
    // narrow stacks, so each month reads as a column
    const per = Math.max(1, Math.min(5, Math.floor((colW - 8) / step)))
    const bands = counts.map(c => Math.ceil(c / per) * step)
    const total = bands.reduce((a, b) => a + b + head, 0) + 2 * 18 + 24
    fit = { step, per, bands }
    if (total <= H) break
  }
  const marks = {}
  const labels = []
  const order = []
  let y = 0
  SOURCES.forEach(({ kind, short }, b) => {
    y += head
    const bottom = y + fit.bands[b]
    const seen = {}
    doc[kind].forEach((r, i) => {
      const m = r[0].slice(0, 7)
      const col = ms.indexOf(m)
      if (col < 0) return
      const j = (seen[m] = (seen[m] ?? -1) + 1)
      marks[`${kind}${i}`] = {
        x: labelW + col * colW + 1 + (j % fit.per) * fit.step,
        y: bottom - (Math.floor(j / fit.per) + 1) * fit.step,
        s,
      }
      order.push(`${kind}${i}`)
    })
    labels.push({
      key: `band-${kind}`,
      x: 0,
      y: narrow ? y - head : y,
      w: narrow ? W : labelW - 12,
      text: f.L(short),
      n: doc[kind].length,
      kind: "band",
    })
    y = bottom + 18
    if (b < 2)
      labels.push({
        key: `rule-${kind}`,
        x: labelW,
        y: y - 9,
        w: W - labelW,
        kind: "rule",
      })
  })
  ms.forEach((m, k) => {
    if (narrow && k % 3) return
    labels.push({
      key: `m-${m}`,
      x: labelW + k * colW,
      y: y - 10,
      text: f.date(`${m}-01`, {
        month: "short",
        ...(k === 0 || m.endsWith("-01") ? { year: "2-digit" } : {}),
      }),
      kind: "tick",
    })
  })
  return { marks, labels, order, height: y + 14 }
}

// groups of marks, wrapped in rows, one column per source
const byGroups = (doc, W, H, f, lens) => {
  const narrow = W < 640
  const gutter = 28
  const lineH = 17
  const cols = narrow
    ? [W, W, W]
    : (() => {
        // the fact-checks get room in proportion, the two speaking sources share the rest
        if (lens === "verdict")
          return [W * 0.22, W * 0.22, W * 0.56 - 2 * gutter]
        const w = (W - 2 * gutter) / 3
        return [w, w, w]
      })()
  const sets = SOURCES.map(({ kind }) => groupsOf(doc, kind, lens, f))
  const sizeFor = (b, s) => {
    const step = s + GAP
    const per = Math.max(1, Math.floor(cols[b] / step))
    return sets[b].reduce(
      (h, g) => h + lineH + Math.ceil(g.items.length / per) * step + 8,
      22,
    )
  }
  // in the verdict lens, the speaking sources are only the backdrop
  const pick = b => {
    const big = lens === "verdict" && b === 2
    let s = big ? 14 : 8
    while (s > 3 && !narrow && sizeFor(b, s) > H) s -= 0.5
    if (lens === "verdict" && b < 2) s = Math.min(s, 4)
    return s
  }
  const marks = {}
  const labels = []
  const order = []
  let x0 = 0
  let y0 = 0
  SOURCES.forEach(({ kind, short }, b) => {
    const s = pick(b)
    const step = s + GAP
    const per = Math.max(1, Math.floor(cols[b] / step))
    const dim = lens === "verdict" && b < 2
    labels.push({
      key: `head-${kind}`,
      x: x0,
      y: y0,
      w: cols[b],
      text: f.L(short),
      n: doc[kind].length,
      kind: "head",
      dim,
    })
    let y = y0 + 24
    for (const g of sets[b]) {
      if (!(dim && lens === "verdict")) {
        labels.push({
          key: `g-${kind}-${g.key}`,
          x: x0,
          y,
          w: cols[b],
          text: g.label,
          n: g.items.length,
          party: g.party,
          v: g.v,
          kind: "group",
        })
        y += lineH
      }
      g.items.forEach((i, j) => {
        marks[`${kind}${i}`] = {
          x: x0 + (j % per) * step,
          y: y + Math.floor(j / per) * step,
          s,
          party: lens === "who" ? g.party : undefined,
          v: g.v,
          dim,
        }
        order.push(`${kind}${i}`)
      })
      y += Math.ceil(g.items.length / per) * step + (dim ? 0 : 8)
    }
    if (narrow) {
      y0 = y + 22
    } else x0 += cols[b] + gutter
  })
  const height = narrow
    ? y0
    : Math.max(...SOURCES.map((_, b) => sizeFor(b, pick(b))))
  return { marks, labels, order, height }
}

/* ---------- the visual ---------- */

export const LENSES = [
  ["date", ["Par date", "By date"]],
  ["who", ["Par qui parle", "By speaker"]],
  ["verdict", ["Par verdict", "By verdict"]],
]

// The keys of the thread's own texts, outlined among the rest
const threadMarks = (doc, topic) => {
  const th = THREADS[topic]
  if (!doc || doc === "error" || !th) return {}
  const checked = url => doc.f.findIndex(r => r[3].some(o => o[1] === url))
  const out = {}
  const q = doc.p.findIndex(r => r[5] === th.qag.id)
  if (q >= 0) out[`p${q}`] = "rail-q"
  const s = th.statement ? doc.g.findIndex(r => r[6] === th.statement.path) : -1
  if (s >= 0) out[`g${s}`] = "rail-s"
  const c = th.factcheck ? checked(th.factcheck.url) : -1
  if (c >= 0) out[`f${c}`] = "doc-claim"
  const post = th.social ? checked(th.social.url) : -1
  if (post >= 0 && post !== c) out[`f${post}`] = "doc-post"
  return out
}

export const Corpus = ({ topic, f }) => {
  const n = TEXTS.topics[topic]
  const doc = useTopicTexts(topic)
  const ready = doc && doc !== "error"
  const [lens, setLens] = React.useState("date")
  const plotRef = React.useRef(null)
  const W = useWidth(plotRef)
  const phone =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 860px)").matches
  const H = phone ? 900 : 400
  const layout = React.useMemo(() => {
    if (!ready || !W) return null
    return lens === "date" ? byDate(doc, W, H, f) : byGroups(doc, W, H, f, lens)
  }, [ready, doc, W, H, lens, f])
  const mine = React.useMemo(() => threadMarks(doc, topic), [doc, topic])

  // reading a mark: hover (pointer), tap, or the arrow keys
  const [active, setActive] = React.useState(null) // key
  const [pinned, setPinned] = React.useState(false)
  const [sheet, setSheet] = React.useState(null)
  React.useEffect(() => {
    setActive(null)
    setPinned(false)
  }, [lens, topic])
  const nearest = (px, py) => {
    if (!layout) return null
    let best = null
    let bd = Infinity
    for (const [k, m] of Object.entries(layout.marks)) {
      const dx = px - (m.x + m.s / 2)
      const dy = py - (m.y + m.s / 2)
      const d = dx * dx + dy * dy
      if (d < bd) {
        bd = d
        best = k
      }
    }
    const reach = Math.max(9, (layout.marks[best]?.s || 0) * 0.9)
    return bd <= reach * reach ? best : null
  }
  const at = e => {
    const r = plotRef.current.getBoundingClientRect()
    return nearest(e.clientX - r.left, e.clientY - r.top)
  }
  const text =
    active && ready
      ? readText(doc, active[0], doc[active[0]][+active.slice(1)])
      : null
  const m = active && layout?.marks[active]
  const tipRef = React.useRef(null)
  React.useLayoutEffect(() => {
    const tip = tipRef.current
    if (!tip || !m) return
    const box = plotRef.current
    let left = m.x + m.s + 12
    if (left + tip.offsetWidth > box.clientWidth)
      left = m.x - tip.offsetWidth - 12
    let top = m.y - 10
    top = Math.min(top, Math.max(0, layout.height - tip.offsetHeight))
    tip.style.left = `${Math.max(0, left)}px`
    tip.style.top = `${Math.max(-40, top)}px`
  })
  React.useEffect(() => {
    if (!pinned) return undefined
    const away = e => {
      if (!e.target.closest(`.${styles.plot}`)) setPinned(false)
    }
    document.addEventListener("click", away)
    return () => document.removeEventListener("click", away)
  }, [pinned])
  const onKey = e => {
    if (!layout) return
    const keys = [
      "ArrowRight",
      "ArrowDown",
      "ArrowLeft",
      "ArrowUp",
      "Home",
      "End",
    ]
    if (keys.includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
      const o = layout.order
      const i = active ? o.indexOf(active) : -1
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? o.length - 1
            : e.key === "ArrowRight" || e.key === "ArrowDown"
              ? Math.min(o.length - 1, i + 1)
              : Math.max(0, i - 1)
      setActive(o[next])
      setPinned(true)
    }
    if (e.key === "Escape" && active) {
      e.stopPropagation()
      setActive(null)
      setPinned(false)
    }
  }

  const sweep = W || 1
  return (
    <div className={styles.corpus} data-lens={lens}>
      <div className={styles.corpusBar}>
        <div
          className={styles.lenses}
          role="group"
          aria-label={f.L(["Regrouper les textes", "Group the texts"])}
        >
          {LENSES.filter(([k]) => k !== "verdict" || n.f).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={lens === k}
              onClick={() => setLens(k)}
            >
              {f.L(label)}
            </button>
          ))}
        </div>
        <span className={styles.corpusTotals}>
          {SOURCES.map(({ kind, label }) => (
            <button
              key={kind}
              type="button"
              className={styles.listLink}
              onClick={() => setSheet({ kind })}
            >
              <b>{f.num(n[kind])}</b> {f.L(label)}
            </button>
          ))}
        </span>
      </div>
      <div
        ref={plotRef}
        className={styles.plot}
        style={{ height: layout ? layout.height : phone ? 420 : H }}
        tabIndex={0}
        role="group"
        aria-roledescription={f.L(["corpus de textes", "corpus of texts"])}
        aria-label={f.L([
          `${n.p + n.g + n.f} textes sur « ${f.L(TOPICS[topic].name)} ». Flèches pour lire chaque texte.`,
          `${n.p + n.g + n.f} texts on ‘${f.L(TOPICS[topic].name)}’. Use the arrow keys to read each text.`,
        ])}
        onKeyDown={onKey}
        onPointerMove={e => {
          if (e.pointerType !== "mouse" || pinned) return
          setActive(at(e))
        }}
        onPointerLeave={() => !pinned && setActive(null)}
        onClick={e => {
          if (e.target.closest(`.${styles.card}`)) return
          const k = at(e)
          if (!k) return setPinned(false)
          setActive(k)
          setPinned(p => !(p && k === active))
        }}
      >
        {!ready ? (
          <p className={styles.fine}>
            {doc === "error"
              ? f.L([
                  "Les textes n'ont pas pu être chargés.",
                  "The texts could not be loaded.",
                ])
              : f.L(["Chargement des textes…", "Loading the texts…"])}
          </p>
        ) : null}
        {layout
          ? layout.labels.map(l =>
              l.kind === "rule" ? (
                <span
                  key={l.key}
                  className={styles.plotRule}
                  style={{ left: l.x, top: l.y, width: l.w }}
                />
              ) : (
                <span
                  key={`${lens}-${l.key}`}
                  className={`${styles.plotLabel} ${styles[`pl_${l.kind}`]} ${l.dim ? styles.isDim : ""}`}
                  style={{ left: l.x, top: l.y, width: l.w }}
                  data-party={l.party}
                  data-v={l.v}
                >
                  {l.party || l.v ? <i aria-hidden="true" /> : null}
                  {l.text}
                  {l.n != null ? <b> {f.num(l.n)}</b> : null}
                </span>
              ),
            )
          : null}
        {layout
          ? Object.entries(layout.marks).map(([k, p]) => (
              <i
                key={k}
                className={`${styles.mark} ${mine[k] ? styles.isThread : ""} ${k === active ? styles.isActive : ""} ${p.dim ? styles.isDim : ""}`}
                data-party={p.party}
                data-v={p.v}
                data-kind={k[0]}
                style={{
                  transform: `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.s / 10})`,
                  transitionDelay: still()
                    ? "0ms"
                    : `${Math.round((p.x / sweep) * 260)}ms`,
                }}
              />
            ))
          : null}
        {text && m ? (
          <div
            ref={tipRef}
            className={`${styles.card} ${pinned ? styles.isKept : ""}`}
            role={pinned ? "dialog" : undefined}
            aria-label={pinned ? f.L(["Texte", "Text"]) : undefined}
          >
            <TextCard kind={active[0]} x={text} f={f} />
          </div>
        ) : null}
        <span className={styles.srOnly} aria-live="polite">
          {text ? describe(active[0], text, f) : ""}
        </span>
      </div>
      <div className={styles.corpusNotes}>
        <p className={styles.fine}>
          {THREADS[topic] ? (
            <span className={styles.threadKey}>
              <i aria-hidden="true" />
              {f.L(["Le fil suivi", "The thread we followed"])} ·{" "}
            </span>
          ) : null}
          {lens === "verdict"
            ? `${f.L(["Questions et déclarations n'ont pas de verdict : elles restent en gris. ", "Questions and statements carry no verdict: they stay grey. "])}${say(f, NOTES.selection)}`
            : lens === "who"
              ? say(f, NOTES.party)
              : say(f, NOTES.corpus, {
                  from: day(f, ORIGINS.window[0]),
                  to: day(f, ORIGINS.window[1]),
                  until: day(f, ORIGINS.method.sources.parliamentUntil),
                })}
        </p>
      </div>
      <TextSheet
        open={sheet}
        topic={topic}
        doc={doc}
        f={f}
        onClose={() => setSheet(null)}
      />
    </div>
  )
}
