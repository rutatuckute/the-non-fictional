import * as React from "react"
import { Link, graphql } from "gatsby"
import { Card, Button, Container, Row } from 'react-bootstrap'

import { FaFolderOpen, FaCoffee } from "react-icons/fa"
import { MdOutlineDateRange } from "react-icons/md"
import { BsLightbulb } from "react-icons/bs"

import Bio from "../components/bio"
import Layout from "../components/layout"
import Seo from "../components/seo"

const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.markdownRemark
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const { previous, next } = pageContext

  return (
    <Layout location={location} title={siteTitle}>
      <Seo
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />
      <Container fluid>
      <article
        className="blog-post"
        itemScope
        itemType="http://schema.org/Article"
      >
        <header>
          <h1 itemProp="headline" className={post.frontmatter.category_id}>{post.frontmatter.title}</h1>
          <p>
            <MdOutlineDateRange/> {post.frontmatter.date} &nbsp;&nbsp;
            <FaFolderOpen/> {post.frontmatter.category} &nbsp;&nbsp;
            <FaCoffee/> {post.timeToRead} min &nbsp;&nbsp;
            <BsLightbulb/> {post.frontmatter.topic}
          </p>
        </header>
        <section
          className="blog-text"
          dangerouslySetInnerHTML={{ __html: post.html }}
          itemProp="articleBody"
        />
        <hr />
        {/* <footer>
          <Bio />
        </footer> */}
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

export const pageQuery = graphql`
  query BlogPostBySlug(
    $slug: String!
  ) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        cover_image
        category
        category_id
        topic
      }
      timeToRead
    }
  }
`
