import * as React from "react"
import { Link, graphql } from "gatsby"

import Seo from "../components/seo"
import Layout from "../components/layout"
import NavBar from "../components/navbar"


const IndexPage = ({ data, location }) => {
  
  return (
    <Layout location={location}>
    <Seo title="Landing Page"/>
    </Layout>
  )
}

export default IndexPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
        }
      }
    }
  }
`