import * as React from "react"
import { graphql } from "gatsby"
import { Container } from "react-bootstrap"

import Layout from "../components/layout"

const PhotoPostTemplate = ({ data, location }) => {
  const photo = data.markdownRemark

  return (
    <Layout location={location} activeSection="photography">
      <Container fluid>
        <article className="blog-post">
          <div>
            <h1 className="photography">{photo.frontmatter.title}</h1>
            <p>
              {photo.frontmatter.location} | {photo.frontmatter.year}
            </p>
          </div>
          <section
            className="blog-text"
            dangerouslySetInnerHTML={{ __html: photo.html }}
          />
        </article>
      </Container>
    </Layout>
  )
}

export default PhotoPostTemplate

export const Head = ({ data }) => {
  const site = data.site.siteMetadata
  const photo = data.markdownRemark
  const canonical = `${site.siteUrl}${photo.fields.slug}`

  return (
    <>
      <title>{photo.frontmatter.title} | {site.title}</title>
      <link rel="canonical" href={canonical} />
      <meta name="description" content={photo.excerpt} />
    </>
  )
}

export const query = graphql`
  query PhotoPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        siteUrl
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      excerpt(pruneLength: 160)
      html
      fields {
        slug
      }
      frontmatter {
        title
        location
        year
      }
    }
  }
`
