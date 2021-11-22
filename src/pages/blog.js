import * as React from "react"
import { graphql, Link } from "gatsby"
import { Card, Button, Container, Row } from 'react-bootstrap'

import Layout from "../components/layout"

const BlogIndex = ({data, location}) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const posts = data.allMarkdownRemark.nodes

  return (
    <Layout location={location}>
      <Container fluid>
        <Row className="justify-content-md-center">
          {posts.map(post => {
            const title = post.frontmatter.title || post.fields.slug

            return (

              <Card style={{ width: '18rem' }} border="secondary" key={post.fields.slug}>
                <Card.Title>{title}</Card.Title>
                <Card.Img variant="top" src={post.frontmatter.cover_image}/>
                <Card.Body>
                  <Card.Text>{post.frontmatter.category}</Card.Text>
                  <Card.Text>{post.frontmatter.excerpt}</Card.Text>
                  <Card.Text>{post.frontmatter.date}</Card.Text>
                  <Button className={post.frontmatter.category_id} href={post.fields.slug}>Continue Reading</Button>
                </Card.Body>
              </Card>

            )
          })}

        </Row>
    </Container>
    </Layout>
  );
};

export default BlogIndex

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
          excerpt
          cover_image
          category
          category_id
        }
      }
    }
  }
`