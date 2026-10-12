"use client"

import * as React from "react"
import Link from "next/link"

import Masthead from "../../../components/masthead"
import PhotoImage from "../../../components/photo-image"
import { Glyph } from "../../../components/redesign/FieldKey"
import SiteFooter from "../../../components/site-footer"
import styles from "../../../styles/blog.module.css"

// Set as a front page: the newest piece leads in the middle, the next two
// stand beside it, the (Anti)library sits on the right, and the rest follow
// in one row of four. One filter bar above drives all of it.

const FORMS = {
  essays: "Essays",
  reflections: "Reflections",
  data: "Data",
}
const FORM_ONE = { essays: "Essay", reflections: "Reflection", data: "Data" }
// The homepage field's names for the same three, which its marks are keyed by.
const FORMAT = { essays: "essay", reflections: "reflection", data: "data" }

// The order the archive field declares its inquiries in, so the two surfaces
// name them the same way round.
const INQUIRIES = [
  "systems",
  "reality",
  "agency",
  "power",
  "connection",
  "memory",
]

// Inquiries are stored lowercase. In sentence case they need their capital.
const capitalise = value =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value

const formOf = post => {
  const id = post.frontmatter?.category_id
  return FORMS[id] ? id : "essays"
}

const SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

const Mark = ({ form }) => (
  <svg
    className={styles.mark}
    viewBox="-10 -10 20 20"
    width="14"
    height="14"
    aria-hidden="true"
    focusable="false"
  >
    <Glyph format={FORMAT[form]} />
  </svg>
)

const Icon = ({ children }) => (
  <svg
    className={styles.icon}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
)

const Dateline = ({ post }) => {
  const { date, inquiry } = post.frontmatter || {}
  return (
    <p className={styles.label}>
      {date ? SHORT.format(new Date(date)) : null}
      {inquiry ? (
        <>
          {" "}
          <span className={styles.in}>in</span> {capitalise(inquiry)}
        </>
      ) : null}
    </p>
  )
}

// The form in its own colour, with the mark the homepage field uses for it,
// so the two pages share one key.
const Byline = ({ post }) => {
  const form = formOf(post)
  return (
    <p className={`${styles.label} ${styles.quiet} ${styles.byline}`}>
      <span className={styles.form}>
        <Mark form={form} />
        {FORM_ONE[form]}
      </span>
      <span aria-hidden="true">·</span> {post.timeToRead} min read
    </p>
  )
}

const excerptOf = post => post.frontmatter?.excerpt || post.excerpt

const Cover = ({ post, px, className }) => (
  <div className={`${styles.cover} ${className}`}>
    {post.frontmatter?.cover_image ? (
      <PhotoImage source={post.frontmatter.cover_image} px={px} alt="" />
    ) : null}
  </div>
)

// Each label leads its own options, as Photography sets its kit.
const FilterGroup = ({ icon, label, options, value, onChange, marks = false }) => (
  <div className={styles.group} role="group" aria-label={label}>
    <span className={styles.groupLabel}>
      <Icon>{icon}</Icon>
      <span className={`${styles.label} ${styles.quiet}`}>{label}</span>
    </span>
    <span className={styles.options}>
      {options.map(([id, name]) => {
        const form = marks && id !== "all" ? id : undefined
        return (
          <button
            key={id}
            type="button"
            className={styles.option}
            data-form={form}
            data-on={value === id ? "true" : "false"}
            aria-pressed={value === id}
            onClick={() => onChange(id)}
          >
            {form ? <Mark form={form} /> : null}
            {name}
          </button>
        )
      })}
    </span>
  </div>
)

const Library = ({ entry }) => (
  <aside className={styles.library} aria-labelledby="library">
    <h2 className={`${styles.label} ${styles.libraryHead}`} id="library">
      {/* A bookshelf: four spines of different heights, one leaning. */}
      <svg className={styles.shelf} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 20h18" />
        <path d="M5 20V7h3v13" />
        <path d="M9 20V5h3v15" />
        <path d="M13 20V9h2.5v11" />
        <path d="M16.6 20l1.6-11.5 2.6.4L19.2 20" />
      </svg>
      (Anti)library
    </h2>

    {/* The piece itself, in its own words. */}
    <a className={`${styles.piece} ${styles.reading}`} href={entry.url}>
      <p className={`${styles.label} ${styles.quiet}`}>{entry.kind}</p>
      <p className={styles.label}>
        {entry.source}
        {entry.format ? <span className={styles.quiet}> · {entry.format}</span> : null}
      </p>
      <h3 className={`${styles.title} ${styles.readingTitle}`}>{entry.title}</h3>
      {entry.standfirst ? <p className={styles.readingDek}>{entry.standfirst}</p> : null}
      {entry.author ? <p className={`${styles.label} ${styles.quiet}`}>{entry.author}</p> : null}
    </a>

    {/* What I make of it: set apart, in a different voice. */}
    {entry.notes.length ? (
      <figure className={styles.take}>
        <figcaption className={`${styles.label} ${styles.takeHead}`}>
          <svg className={styles.pen} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 20l1-4L16 5l3 3L8 19z" />
            <path d="M14 7l3 3" />
          </svg>
          Thoughts
        </figcaption>
        <blockquote className={styles.takeText}>
          {entry.notes.map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </blockquote>
      </figure>
    ) : null}
  </aside>
)

const WritingsIndex = ({ posts, library }) => {
  const [form, setForm] = React.useState("all")
  const [inquiry, setInquiry] = React.useState("all")

  const visible = React.useMemo(
    () =>
      posts.filter(
        post =>
          (form === "all" || formOf(post) === form) &&
          (inquiry === "all" || post.frontmatter?.inquiry === inquiry),
      ),
    [form, inquiry, posts],
  )

  const inquiries = React.useMemo(() => {
    const present = new Set(posts.map(post => post.frontmatter?.inquiry))
    return INQUIRIES.filter(id => present.has(id))
  }, [posts])

  const [lead, ...after] = visible
  const side = after.slice(0, 2)
  const earlier = after.slice(2)

  return (
    <div className={styles.page}>
      <Masthead activeSection="writings" />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.nameplate}>
            <h1 className={styles.name}>Writings</h1>
            <p className={styles.tagline}>Making sense out of it.</p>
          </div>

          <div className={styles.filters}>
            <FilterGroup
              label="Forms"
              icon={
                <>
                  <path d="M4 5h16" />
                  <path d="M4 12h16" />
                  <path d="M4 19h10" />
                </>
              }
              options={[["all", "All"], ...Object.entries(FORMS)]}
              marks
              value={form}
              onChange={setForm}
            />
            <FilterGroup
              label="Inquiries"
              icon={
                <>
                  <circle cx="12" cy="12" r="8" />
                  <circle cx="12" cy="12" r="3" />
                </>
              }
              options={[["all", "All"], ...inquiries.map(id => [id, capitalise(id)])]}
              value={inquiry}
              onChange={setInquiry}
            />
          </div>
        </header>

        {!lead ? (
          <p className={styles.empty}>Nothing published here yet.</p>
        ) : (
          <div
            className={styles.spread}
            data-sides={side.length ? "true" : "false"}
            data-library={library ? "true" : "false"}
          >
            {side.length ? (
              <div className={styles.left}>
                {side.map(post => (
                  <Link
                    className={`${styles.piece} ${styles.small}`}
                    data-form={formOf(post)}
                    href={post.fields.slug}
                    key={post.id}
                  >
                    <Cover post={post} px={760} className={styles.smallCover} />
                    <Dateline post={post} />
                    <h3 className={styles.title}>{post.frontmatter?.title}</h3>
                    <Byline post={post} />
                  </Link>
                ))}
              </div>
            ) : null}

            <Link
              className={`${styles.piece} ${styles.lead}`}
              data-form={formOf(lead)}
              href={lead.fields.slug}
            >
              <Cover post={lead} px={1200} className={styles.leadCover} />
              <Dateline post={lead} />
              <h2 className={`${styles.title} ${styles.leadTitle}`}>{lead.frontmatter?.title}</h2>
              {excerptOf(lead) ? <p className={styles.dek}>{excerptOf(lead)}</p> : null}
              <Byline post={lead} />
            </Link>

            {library ? <Library entry={library} /> : null}
          </div>
        )}

        {earlier.length ? (
          <section className={styles.earlier} aria-labelledby="earlier">
            <h2 className={`${styles.label} ${styles.quiet} ${styles.earlierHead}`} id="earlier">
              Earlier
            </h2>
            <ol className={styles.grid}>
              {earlier.map(post => (
                <li key={post.id}>
                  <Link
                    className={`${styles.piece} ${styles.card}`}
                    data-form={formOf(post)}
                    href={post.fields.slug}
                  >
                    <Cover post={post} px={760} className={styles.cardCover} />
                    <Dateline post={post} />
                    <h3 className={styles.title}>{post.frontmatter?.title}</h3>
                    {excerptOf(post) ? (
                      <p className={`${styles.dek} ${styles.cardDek}`}>{excerptOf(post)}</p>
                    ) : null}
                    <Byline post={post} />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}

export default WritingsIndex
