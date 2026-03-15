import * as React from "react"
import { useMemo, useState } from "react"
import { graphql } from "gatsby"
import { Modal } from "react-bootstrap"
import { BsPinMapFill } from "react-icons/bs"
import { ImZoomIn } from "react-icons/im"

import Layout from "../components/layout"

const FILTERS = [
  { key: "all", label: "All" },
  { key: "portraits", label: "Portraits" },
  { key: "strangers", label: "Strangers" },
  { key: "scenes", label: "Scenes" },
  { key: "lights", label: "Lights" },
]

const getHaystack = (photo) => {
  const fm = photo.frontmatter || {}
  const parts = [
    fm.title || "",
    fm.location || "",
    fm.year || "",
    ...(fm.tags || []),
    fm.type || "",
  ]
  return parts.join(" ").toLowerCase()
}

const Photography = ({ data, location }) => {
  const allPhotos = data?.allMarkdownRemark?.nodes ?? []

  const [query, setQuery] = useState("")
  const [active, setActive] = useState("all")
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const photos = useMemo(() => {
    const q = query.trim().toLowerCase()

    return allPhotos.filter((photo) => {
      const type = photo.frontmatter?.type || ""
      const passType = active === "all" ? true : type === active
      if (!passType) return false

      if (!q) return true
      return getHaystack(photo).includes(q)
    })
  }, [allPhotos, query, active])

  return (
    <Layout location={location}>
      <div className="photo-page">
        <header className="photo-head">
          <div className="photo-controls">
            <nav className="photo-tabs" aria-label="Photography filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`photo-tab ${active === f.key ? "is-active" : ""}`}
                  onClick={() => setActive(f.key)}
                >
                  {f.label}
                </button>
              ))}
              <div className="photo-tabs-divider" />
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

        <section className="photo-grid-page">
          {photos.map((photo) => {
            const title = photo.frontmatter?.title || photo.fields?.slug
            const slug = photo.fields?.slug

            if (!slug) return null

            return (
              <article className="photo-card-page" key={slug}>
                <div className="photo-card-image-wrap">
                  <img
                    className="photo-card-image"
                    src={photo.frontmatter?.photo}
                    alt={title}
                  />

                  <div className="photo-card-actions">
                    <button
                      type="button"
                      className="photo-action-link photo-action-button"
                      onClick={() => setSelectedPhoto(photo)}
                      aria-label="Open photo preview"
                    >
                      <ImZoomIn size={18} />
                    </button>
                  </div>
                </div>

                <div className="photo-card-meta">
                  <h2 className="photo-card-title">{title}</h2>

                  <div className="photo-card-location">
                    {photo.frontmatter?.location} | {photo.frontmatter?.year}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        {photos.length === 0 ? (
          <div className="photo-empty">
            Nothing matched your search yet.
          </div>
        ) : null}

        <Modal
          show={!!selectedPhoto}
          onHide={() => setSelectedPhoto(null)}
          centered
          size="xl"
          className="photo-modal"
        >
          <Modal.Body className="photo-modal-body">
            {selectedPhoto && (
              <>
                <img
                  src={selectedPhoto.frontmatter?.photo}
                  alt={selectedPhoto.frontmatter?.title || "Photo"}
                  className="photo-modal-image"
                />
                <div className="photo-modal-meta">
                  <h2 className="photo-modal-title">
                    {selectedPhoto.frontmatter?.title}
                  </h2>
                  <p className="photo-modal-location">
                    {selectedPhoto.frontmatter?.location} | {selectedPhoto.frontmatter?.year}
                  </p>
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </Layout>
  )
}

export default Photography

export const Head = ({ data }) => {
  const siteTitle = data?.site?.siteMetadata?.title || "The Non Fictional"
  return (
    <>
      <title>Photography | {siteTitle}</title>
      <meta
        name="description"
        content="Photography on The Non Fictional."
      />
    </>
  )
}

export const pageQuery = graphql`
  query PhotographyPage {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { layout: { eq: "photography" } } }
    ) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          location
          year
          tags
          photo
          type
        }
      }
    }
  }
`