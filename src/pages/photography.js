import * as React from "react"
import { graphql } from "gatsby"
import { Card } from 'react-bootstrap'

import Layout from "../components/layout"

const Photography = ({data, location}) => {

  const photos = data.allMarkdownRemark.nodes

  return (
    <Layout location={location}>
    {photos.map(photo => {
            const title = photo.frontmatter.title || photo.fields.slug

            return (
              <Card>
                <Card.Img variant="top" src={photo.frontmatter.photo}/>
                <Card.Header>{title}</Card.Header>
                </Card>
            )
          })}
    </Layout>
  );
};

export default Photography

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }
                      filter: {frontmatter: {layout: {eq: "photography"}}}) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          photo
        }
      }
    }
  }
`