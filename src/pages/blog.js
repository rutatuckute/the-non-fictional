import * as React from "react"
import { useMemo, useState } from "react"
import { graphql, Link } from "gatsby"

import Layout from "../components/layout"

const FILTERS = [
  { key: "all", label: "All" },
  { key: "essays", label: "Essays" },
  { key: "reflections", label: "Reflections" },
  { key: "data", label: "Data" },
]

const getHaystack = (post) => {
  const fm = post.frontmatter || {}
  const parts = [
    fm.title || "",
    fm.excerpt || "",
    fm.topic || "",
    fm.category || "",
    ...(fm.tags || []),
  ]
  return parts.join(" ").toLowerCase()
}

const BlogIndex = ({ data, location }) => {
  const allPosts = data?.allMarkdownRemark?.nodes ?? []

  const [query, setQuery] = useState("")
  const [active, setActive] = useState("all")

  // Filter + search
  const posts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return allPosts.filter((p) => {
      const cat = p.frontmatter?.category_id || ""
      const passType = active === "all" ? true : cat === active
      if (!passType) return false

      if (!q) return true
      return getHaystack(p).includes(q)
    })
  }, [allPosts, query, active])

  return (
    <Layout location={location}>
      <div className="writing-page">

       <header className="writing-head">
        <div className="writing-controls">
            <nav className="writing-tabs" aria-label="Writing filters">
            {FILTERS.map((f) => (
                <button
                key={f.key}
                type="button"
                className={`writing-tab ${active === f.key ? "is-active" : ""}`}
                onClick={() => setActive(f.key)}
                >
                {f.label}
                </button>
            ))}
            <div className="writing-tabs-divider" />
            </nav>

          <div className="search-box">
            <span className="search-icon-wrap">
              <i className="bi bi-search search-icon"></i>
            </span>

            <input
              className="search-input"
              type="search"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        </header>

        <section className="writing-grid" aria-label="Writing list">
          {posts.map((p) => {
            const slug = p.fields?.slug
            if (!slug) return null

            const fm = p.frontmatter || {}
            const catId = fm.category_id || "data"
            const isReflection = catId === "general-theory"

            return (
              <Link
                key={p.id}
                to={slug}
                className={`writing-card ${catId}`}
                aria-label={fm.title || "Post"}
              >
                {!isReflection && fm.cover_image ? (
                  <div className="writing-card-media">
                    <img
                      className="writing-card-img"
                      src={fm.cover_image}
                      alt={fm.title || "Cover"}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="writing-card-media writing-card-media--none" />
                )}

                <div className="writing-card-body">
                  <div className="writing-card-kicker">
                    <span className="writing-card-dot" aria-hidden />
                    <span className="writing-card-type">
                      {FILTERS.find((x) => x.key === catId)?.label || "Writing"}
                    </span>
                    {fm.topic ? <span className="writing-card-sep">/</span> : null}
                    {fm.topic ? <span className="writing-card-topic">{fm.topic}</span> : null}
                  </div>

                  <h2 className="writing-card-title">{fm.title}</h2>

                  <p className="writing-card-excerpt">
                    {fm.excerpt || p.excerpt}
                  </p>

                  <div className="writing-card-meta">
                    <span>{fm.date}</span>
                    <span className="writing-card-meta-sep">·</span>
                    <span>{p.timeToRead} min</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>

        {posts.length === 0 ? (
          <div className="writing-empty">
            Nothing matched your search yet.
          </div>
        ) : null}
      </div>
    </Layout>
  )
}

export default BlogIndex

export const Head = ({ data }) => {
  const siteTitle = data?.site?.siteMetadata?.title || "The Non Fictional"
  return (
    <>
      <title>Writings | {siteTitle}</title>
      <meta
        name="description"
        content="Data, reflections, and inquiries — writings on The Non Fictional."
      />
    </>
  )
}

export const pageQuery = graphql`
  query WritingIndexPage {
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
        excerpt(pruneLength: 160)
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          excerpt
          cover_image
          category
          category_id
          topic
          tags
        }
        timeToRead
      }
    }
  }
`
