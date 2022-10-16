import * as React from "react"
import { graphql } from "gatsby"

import { Card } from 'react-bootstrap'

import Layout from "../components/layout"
import Seo from "../components/seo"

const PhotoPostTemplate = ({ data, location }) => {

  const photo = data.markdownRemark
  const siteTitle = data.site.siteMetadata?.title || `Title`

  return (
    <Layout location={location} title={siteTitle}>
      <Seo title={photo.frontmatter.title}/>
      <Card.Img 
          className="photography-full" 
          variant="top"
          src={photo.frontmatter.photo}/>
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
        photo
        title
        location
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`