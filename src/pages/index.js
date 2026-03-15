import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"

const IndexPage = ({ data, location }) => {
  const blogPosts = data.blog.nodes
  const photoPosts = data.photos.nodes

  // 1) Selected post: manual first, else fallback to latest
  const manualSelected = blogPosts.find(
    (p) => p.frontmatter?.selected === true
  )
  const selected = manualSelected || blogPosts[0]
  const rest = blogPosts.filter((p) => p.id !== selected?.id)

  // 2) Group by category_id
  const groups = { data: [], reflections: [], essays: [] }
  for (const p of rest) {
    const k = (p.frontmatter?.category_id || "").toLowerCase()
    if (k in groups) groups[k].push(p)
  }

  const take = (arr, n) => arr.slice(0, n)

  return (
    <Layout location={location}>
      <div className="home-container">
    {selected && (
        <section className={`selected ${selected.frontmatter.category_id}`}>
            <div className="selected-title">
            <h4 className="selected-heading">In focus</h4>
            <div className="selected-rule" />
            </div>

            <div className="selected-grid">
            <div className="selected-left">
                <h5 className={`selected-title ${selected.frontmatter.category_id}`}>
                <Link to={selected.fields.slug}>
                    {selected.frontmatter.title}
                </Link>
                </h5>

                <div className="selected-date">
                {selected.frontmatter.date}
                </div>

                <p className="selected-excerpt">
                {selected.frontmatter.excerpt || selected.excerpt}
                </p>

                <Link to={selected.fields.slug} className={`outline-button ${selected.frontmatter.category_id}-button`}>
                Continue reading
                </Link>
            </div>

            {selected.frontmatter.cover_image && (
                <Link className="selected-right" to={selected.fields.slug} aria-label="Read selected post">
                <img
                    className="selected-image"
                    src={selected.frontmatter.cover_image}
                    alt={selected.frontmatter.title || "Selected post image"}
                    loading="lazy"
                />
                </Link>
            )}
            </div>
        </section>
        )}

        {/* Writing columns */}
        <section className="writing-section">
           <div className="selected-title">
            <h4 className="selected-heading">Latest pieces</h4>
            <div className="selected-rule" />
            </div>
          <div className="writing-grid">
            <WritingColumn title="Essays" category="essays" posts={take(groups.essays, 3)} moreTo="/blog?type=essays" />
            <WritingColumn title="Reflections" category="reflections" posts={take(groups.reflections, 3)} moreTo="/blog?type=reflections" />
            <WritingColumn title="Data" category="data" posts={take(groups.data, 3)} moreTo="/blog?type=data" />
          </div>
        </section>

      {/* Photography */}
      <section className="photo-section">
            <div className="selected-title">
            <h4 className="selected-heading">Photography</h4>
            <div className="selected-rule" />
            
      <Link to="/photography" className="outline-button photography-button">
        Gallery
      </Link>
        </div>

        <div className="photo-grid">
        {photoPosts.slice(0, 6).map((p) => (
          <div key={p.id} className="photo-item">
            <img
              src={p.frontmatter.photo}
              alt={p.frontmatter.title || "Photo"}
              className="photo-image"
            />
          </div>
        ))}
        </div>
      </section>

      </div>
    </Layout>
  )
}

const WritingColumn = ({ title, posts, moreTo, category }) => (
  <section className={`writing-col ${category}`}>
    <header className="writing-col-head">
      <h3 className="writing-col-title">{title}</h3>
    </header>

    <div className="writing-col-items">
      {posts.map((p) => (
        <article key={p.id} className="writing-item">
          <Link to={p.fields.slug} className="writing-item-link">
            {p.frontmatter.title}
          </Link>
          <div className="writing-item-date">{p.frontmatter.date}</div>
        </article>
      ))}
    </div>
    <br></br>

    <Link to={moreTo} className={`outline-button ${category}-button`}>
        More
      </Link>

  </section>
)


export default IndexPage

export const Head = ({ data }) => (
  <>
    <title>{data.site.siteMetadata.title}</title>
    <meta name="description" content={data.site.siteMetadata.description} />
  </>
)

export const pageQuery = graphql`
  query HomePage {
    site {
      siteMetadata {
        title
        description
      }
    }

    blog: allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { layout: { eq: "blog" } } }
      limit: 50
    ) {
      nodes {
        id
        excerpt(pruneLength: 220)
        fields {
          slug
        }
        frontmatter {
          title
          date(formatString: "MMMM DD, YYYY")
          excerpt
          cover_image
          category_id
          selected
        }
      }
    }

    photos: allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { layout: { ne: "blog" } } }
      limit: 30
    ) {
      nodes {
        id
        fields {
          slug
        }
        frontmatter {
          title
          photo
        }
      }
    }
  }
`
