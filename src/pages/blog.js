import * as React from "react"
import { useState } from "react"
import { graphql, Link } from "gatsby"
import { Card, Button, Container, Row, Col } from 'react-bootstrap'
import { FaFolderOpen, FaCoffee, FaTwitterSquare} from "react-icons/fa"
import { MdOutlineDateRange } from "react-icons/md"
import { BsLightbulb } from "react-icons/bs"
import { ImSearch } from "react-icons/im"


import Layout from "../components/layout"
import BlogDropdown from "../components/dropdown"

const BlogIndex = ({data, location}) => {
  const allPosts = data.allMarkdownRemark.nodes
  const emptyQuery = ""

  const [state, setState] = useState({
    filteredData: [],
    query: emptyQuery,
  })

  const handleInputChange = event => {

    const query = event.target.value
    const posts = data.allMarkdownRemark.nodes || []

    const filteredData = posts.filter(post => {
      const excerpt = post.frontmatter.excerpt
      const title = post.frontmatter.title
      const tags = post.frontmatter.tags

      return (
        excerpt.toLowerCase().includes(query.toLowerCase()) ||
        title.toLowerCase().includes(query.toLowerCase()) ||
        (tags && tags
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()))
      )
    })

    setState({
      query,
      filteredData,
    })
  }

  const { filteredData, query } = state
  const hasSearchResults = filteredData && query !== emptyQuery
  const posts = hasSearchResults ? filteredData : allPosts


  return (
    <Layout location={location}>
      <Container fluid>
        
        <Row className="justify-content-md-center">
        <Col sm={10}>
        <Row className="justify-content-md-center">
          {posts.map(post => {
            const title = post.frontmatter.title || post.fields.slug

            return (
              <Card border="secondary" key={post.fields.slug} className={post.frontmatter.category_id}>
                <Card.Title>{title}</Card.Title>
                <Card.Img variant="top" src={post.frontmatter.cover_image}/>
                <Card.Body>
                  <Card.Text>
                        <MdOutlineDateRange/> {post.frontmatter.date}{'  '} &nbsp;&nbsp;
                        <FaFolderOpen/> {post.frontmatter.category} &nbsp;&nbsp;
                        <FaCoffee/> {post.timeToRead} min <br/>
                        <BsLightbulb/> {post.frontmatter.topic}
                  </Card.Text>
                  <Card.Text>{post.frontmatter.excerpt}</Card.Text>
                  <Button href={post.fields.slug}>Continue Reading</Button> &nbsp;&nbsp;
                  <Button className="twitter-share-button" href="https://twitter.com/share?ref_src=twsrc%5Etfw" data-show-count="false"><FaTwitterSquare size={23}/></Button>
                  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                </Card.Body>
                <a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
              </Card>
              
            )
          })}
          </Row>
          </Col>
          <Col sm={2}>
          {/* <BlogDropdown/> */}
          <ImSearch color="orange"/>
          <input
              type="text"
              aria-label="Search"
              placeholder="Search..."
              onChange={handleInputChange}
          />
        </Col>
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
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }
                      filter: {frontmatter: {layout: {eq: "blog"}}}) {
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
          topic
          tags
        }
        timeToRead
      }
    }
  }
`