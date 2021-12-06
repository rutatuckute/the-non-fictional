import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"


const PhotoPostTemplate = ({ data, location }) => {

  const siteTitle = data.site.siteMetadata?.title || `Title`

  return (
    <Layout location={location} title={siteTitle}>
    </Layout>
  )
}

export default PhotoPostTemplate

export const pageQuery = graphql`
  query PhotoPostBySlug(
    $slug: String!
  ) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`