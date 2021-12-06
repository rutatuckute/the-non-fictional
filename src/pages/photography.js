import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"

const Photography = ({data, location}) => {

  const photos = data.allMarkdownRemark.nodes

  return (
    <Layout location={location}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '90vh'
      }}
    >
      <h1>Photography</h1>
    </div>
    {photos.map(photo => {
            const title = photo.frontmatter.title || photo.fields.slug

            return (
              <h2>{title}</h2>
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
        }
      }
    }
  }
`