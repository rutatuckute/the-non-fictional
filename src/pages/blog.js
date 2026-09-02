import * as React from "react"
import { graphql, Link } from "gatsby"

import Masthead from "../components/masthead"
import PhotoImage from "../components/photo-image"
import SiteFooter from "../components/site-footer"
import * as styles from "./blog.module.css"

// Only the forms the index actually knows about. A form with nothing published
// under it is left out rather than shown as a tab that can never return a
// result — reflections sat there for a long time doing exactly that.
const FORMS = {
  essays: "Essays",
  reflections: "Reflections",
  data: "Data",
}

const searchable = post => {
  const fm = post.frontmatter || {}
  return [
    fm.title,
    fm.excerpt,
    fm.topic,
    fm.category,
    fm.inquiry,
    ...(fm.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

const SearchIcon = () => (
  <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" />
  </svg>
)

const Card = ({ post }) => {
  const fm = post.frontmatter || {}
  const form = FORMS[fm.category_id] ? fm.category_id : "essays"

  return (
    <Link className={styles.card} data-form={form} to={post.fields.slug}>
      <div className={styles.cover}>
        {fm.cover_image ? (
          <PhotoImage
            className={styles.coverImage}
            source={fm.cover_image}
            px={760}
            alt=""
          />
        ) : null}
      </div>

      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{fm.title}</h2>
        {fm.excerpt || post.excerpt ? (
          <p className={styles.cardExcerpt}>{fm.excerpt || post.excerpt}</p>
        ) : null}
        <div className={styles.cardFoot}>
          <span className={styles.cardForm}>{FORMS[form]}</span>
          {fm.inquiry ? <span>{fm.inquiry}</span> : null}
          <span className={styles.cardWhen}>
            {fm.year} · {post.timeToRead} min
          </span>
        </div>
      </div>
    </Link>
  )
}

const WritingsIndex = ({ data, location }) => {
  const posts = data?.allMarkdownRemark?.nodes ?? []
  const [form, setForm] = React.useState("all")
  const [query, setQuery] = React.useState("")

  // Counts come from the posts, so a form appears in the filter row the moment
  // something is published under it and never before.
  const counts = React.useMemo(() => {
    const out = {}
    posts.forEach(p => {
      const id = p.frontmatter?.category_id
      if (FORMS[id]) out[id] = (out[id] || 0) + 1
    })
    return out
  }, [posts])

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter(p => {
      if (form !== "all" && p.frontmatter?.category_id !== form) return false
      return q ? searchable(p).includes(q) : true
    })
  }, [form, posts, query])

  const filtering = form !== "all" || query.trim() !== ""
  const clear = () => {
    setForm("all")
    setQuery("")
  }

  const years = posts.map(p => p.frontmatter?.year).filter(Boolean)
  const span = years.length
    ? `${Math.min(...years)}–${Math.max(...years)}`
    : null

  return (
    <div className={styles.page}>
      <Masthead location={location} activeSection="writings" />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <p className={styles.kicker}>
              {posts.length} {posts.length === 1 ? "piece" : "pieces"}
              {span ? ` · ${span}` : ""}
            </p>
            <h1 className={styles.title}>Writings</h1>
          </div>

          <div className={styles.controls}>
            <div className={styles.group}>
              <span className={styles.groupLabel}>Form</span>
              <div className={styles.groupChips}>
                <button
                  className={styles.chip}
                  type="button"
                  data-on={form === "all" ? "true" : "false"}
                  aria-pressed={form === "all"}
                  onClick={() => setForm("all")}
                >
                  All <span className={styles.chipCount}>{posts.length}</span>
                </button>
                {Object.entries(FORMS)
                  .filter(([id]) => counts[id])
                  .map(([id, label]) => (
                    <button
                      className={styles.chip}
                      key={id}
                      type="button"
                      data-on={form === id ? "true" : "false"}
                      aria-pressed={form === id}
                      onClick={() => setForm(id)}
                    >
                      {label}{" "}
                      <span className={styles.chipCount}>{counts[id]}</span>
                    </button>
                  ))}
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.groupLabel}>Search</span>
              <div className={styles.search}>
                <SearchIcon />
                <input
                  className={styles.searchInput}
                  type="search"
                  placeholder="Title, topic, tag"
                  aria-label="Search writings"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                />
              </div>
            </div>

            <p className={styles.count}>
              {filtering
                ? `${visible.length} of ${posts.length} pieces`
                : `${posts.length} pieces`}
              {filtering ? (
                <button className={styles.clear} type="button" onClick={clear}>
                  Clear
                </button>
              ) : null}
            </p>
          </div>
        </header>

        {visible.length ? (
          <section className={styles.grid} aria-label="Writings">
            {visible.map(post => (
              <Card key={post.id} post={post} />
            ))}
          </section>
        ) : (
          <p className={styles.empty}>Nothing matches that.</p>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

export default WritingsIndex

export const Head = ({ data }) => {
  const siteTitle = data?.site?.siteMetadata?.title || "The Non Fictional"
  return (
    <>
      <title>Writings | {siteTitle}</title>
      <meta
        name="description"
        content="Essays and data pieces on The Non Fictional — questioning, starting with myself."
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400&display=swap"
      />
    </>
  )
}

export const pageQuery = graphql`
  query WritingsIndexPage {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { layout: { eq: "blog" } } }
    ) {
      nodes {
        id
        excerpt(pruneLength: 200)
        timeToRead
        fields {
          slug
        }
        frontmatter {
          title
          excerpt
          cover_image
          category_id
          inquiry
          topic
          tags
          year: date(formatString: "YYYY")
        }
      }
    }
  }
`
