const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const readingTime = require("reading-time")

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode })

    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })

    const stats = readingTime(node.rawMarkdownBody || "")
    createNodeField({
      node,
      name: "readingTime",
      value: {
        text: stats.text,
        minutes: stats.minutes,
        time: stats.time,
        words: stats.words,
      },
    })
  }
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage, createRedirect } = actions

  createRedirect({
    fromPath: `/redesign-lab/`,
    toPath: `/`,
    isPermanent: true,
    redirectInBrowser: true,
  })

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const photoPost = path.resolve(`./src/templates/photo-post.js`)

  const result = await graphql(`
    {
      allMarkdownRemark(sort: { frontmatter: { date: ASC } }, limit: 1000) {
        nodes {
          id
          fields {
            slug
          }
          frontmatter {
            layout
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild(`There was an error loading your posts`, result.errors)
    return
  }

  const posts = result.data.allMarkdownRemark.nodes

  if (posts.length === 0) {
    reporter.warn(`No MarkdownRemark nodes found to create pages.`)
    return
  }

  const blogPosts = posts.filter((post) => post.frontmatter?.layout === "blog")
  const photoPosts = posts.filter(
    (post) => post.frontmatter?.layout === "photography"
  )

  blogPosts.forEach((post, index) => {
    const slug = post?.fields?.slug

    if (!slug) {
      reporter.warn(`Skipping a post because slug is missing (id=${post.id})`)
      return
    }

    const previousPostId = index === 0 ? null : blogPosts[index - 1].id
    const nextPostId = index === blogPosts.length - 1 ? null : blogPosts[index + 1].id

    createPage({
      path: slug,
      component: blogPost,
      context: {
        slug,
        previousPostId,
        nextPostId,
      },
    })
  })

  photoPosts.forEach((post) => {
    const slug = post?.fields?.slug

    if (!slug) {
      reporter.warn(`Skipping a photo because slug is missing (id=${post.id})`)
      return
    }

    createPage({
      path: slug,
      component: photoPost,
      context: { slug },
    })
  })
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      layout: String
      title: String
      excerpt: String
      date: Date @dateformat
      cover_image: String
      category: String
      category_id: String
      inquiry: String
      link: String
      selected: Boolean
      photo: String
      location: String
      series: String
      year: String
      tags: [String]
      type: String
      topic: String
    }

    type Fields {
      slug: String
      readingTime: ReadingTime
    }

    type ReadingTime {
      text: String
      minutes: Float
      time: Float
      words: Int
    }
  `)
}
