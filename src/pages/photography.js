import * as React from "react"
import { graphql } from "gatsby"

import { Card, Row } from 'react-bootstrap'
import { BsPinMapFill } from "react-icons/bs"


import Layout from "../components/layout"

const Photography = ({data, location}) => {

  const photos = data.allMarkdownRemark.nodes

  return (
    <Layout location={location}>
    <Row className="justify-content-md-center">
    {photos.map(photo => {
            const title = photo.frontmatter.title || photo.fields.slug

            return (
              <Card className="photo">
                <Card.Img variant="top" src={photo.frontmatter.photo}/>
                <Card.Header>{title}</Card.Header>
                <Card.Header className="location"><BsPinMapFill/> {photo.frontmatter.location}</Card.Header>
                </Card>
            )
          })}
    </Row>
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
          location
          photo
        }
      }
    }
  }
`