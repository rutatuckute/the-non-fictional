import * as React from "react"
import { graphql } from "gatsby"

import { Card, Row } from 'react-bootstrap'
import { BsPinMapFill } from "react-icons/bs"
import { ImZoomIn, ImNewTab } from "react-icons/im"


import Layout from "../components/layout"

const Photography = ({data, location}) => {

  const photos = data.allMarkdownRemark.nodes

  return (
    <Layout location={location}>
    <Row className="justify-content-md-center">
    {photos.map(photo => {
            const title = photo.frontmatter.title || photo.fields.slug

            const openInNewTab = (url) => {
              const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
              if (newWindow) newWindow.opener = null
            }

            return (
              <Card className="photo">
                <Card.Img 
                          className="photography-image" 
                          variant="top"
                          src={photo.frontmatter.photo}/>
                <p style={{margin:0, padding:0}}>
                <a href={photo.fields.slug}><ImZoomIn color="white" size="20"/></a> &nbsp;
                <ImNewTab color="white" size="20" onClick={() => { openInNewTab(photo.frontmatter.photo) }}/>
                </p>
                <Card.Header style={{margin:0, padding:0}}>{title}</Card.Header>
                <Card.Header className="location"><BsPinMapFill/> {photo.frontmatter.location} | {photo.frontmatter.year}</Card.Header>
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
          year
          tags
          photo
        }
      }
    }
  }
`