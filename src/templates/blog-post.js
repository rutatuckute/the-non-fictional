import * as React from "react"
import { Link, graphql } from "gatsby"
import { Card, Button, Container, Row } from 'react-bootstrap'

import { FaFolderOpen, FaCoffee, FaTwitterSquare, FaGithub} from "react-icons/fa"
import { MdOutlineDateRange } from "react-icons/md"
import { BsLightbulb } from "react-icons/bs"

import Layout from "../components/layout"
import { photoUrl } from "../components/photography/photoData"

// Markdown bodies write plain <img> tags with an explicit width, so they never
// pass through PhotoImage. Rewrite their sources onto the same Image CDN the
// rest of the site uses, budgeting twice the declared width for 2x screens —
// otherwise an icon declared at 30px still pulls a full-size master.
const withResizedImages = (html) =>
  html.replace(
    /<img([^>]*?)src=["'](\/images\/uploads\/[^"']+)["']([^>]*?)>/g,
    (tag, before, src, after) => {
      if (src.endsWith(".svg")) {
        return tag
      }

      const declared = `${before} ${after}`.match(/width=["']?(\d+)/)
      const px = Math.min(declared ? Number(declared[1]) * 2 : 1440, 2560)

      // This markup is injected as a string, so there is no React handler to
      // hang a fallback on — an inline one keeps these images as resilient as
      // the rest, dropping to the file in the repo if the CDN does not answer.
      const fallback = `this.onerror=null;this.src='${src}'`

      return `<img${before}src="${photoUrl(src, px, "normal").replace(
        /&/g,
        "&amp;"
      )}" loading="lazy" decoding="async" onerror="${fallback}"${after}>`
    }
  )

const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.markdownRemark
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const { previous, next } = pageContext

  return (
    <Layout location={location} title={siteTitle} activeSection="writings">
      <Container fluid>
      <article
        className="blog-post"
        itemScope
        itemType="http://schema.org/Article"
      >
        <div>
          <h1 itemProp="headline" className={post.frontmatter.category_id}>{post.frontmatter.title}</h1>
          <p>
            <MdOutlineDateRange/> {post.frontmatter.date} &nbsp;&nbsp;
            <FaFolderOpen/> {post.frontmatter.category} &nbsp;&nbsp;
            <FaCoffee/> {post.timeToRead} min &nbsp;&nbsp;
            <BsLightbulb/> {post.frontmatter.topic} &nbsp;&nbsp;
            {post.frontmatter.category_id=='data' ? <Button className="github-button" href={post.frontmatter.link}>
              <FaGithub size={23}/>Github</Button> : <></>}
            &nbsp;&nbsp;
            <Button className="twitter-button" href="https://twitter.com/share?ref_src=twsrc%5Etfw" data-show-count="false"><FaTwitterSquare size={23}/>Tweet</Button>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
            
          </p>
        </div>
        <section
          className="blog-text"
          dangerouslySetInnerHTML={{ __html: withResizedImages(post.html) }}
          itemProp="articleBody"
        />
        <hr />
      </article>
      <nav className="blog-post-nav">
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={previous.fields.slug} rel="prev">
                ← {previous.frontmatter.title}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={next.fields.slug} rel="next">
                {next.frontmatter.title} →
              </Link>
            )}
          </li>
        </ul>
      </nav>
      </Container>
    </Layout>
  )
}

export default BlogPostTemplate

export const Head = ({ data }) => {
  const siteTitle = data.site.siteMetadata?.title || "The Non Fictional"
  const post = data.markdownRemark

  const title = post.frontmatter.title
  const description = post.excerpt
  const canonical = `${data.site.siteMetadata.siteUrl}${post.fields.slug}`

  return (
    <>
      <title>{title} | {siteTitle}</title>
      <link rel="canonical" href={canonical} />
      <meta name="description" content={description} />

      {/* OpenGraph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonical} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  )
}

export const pageQuery = graphql`
  query BlogPostBySlug(
    $slug: String!
  ) {
    site {
      siteMetadata {
        title
        siteUrl
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      fields {
        slug
        readingTime {
          text
        }
      }
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        cover_image
        category
        category_id
        topic
        link
      }
    }
  }
`
