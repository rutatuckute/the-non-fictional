module.exports = {

  siteMetadata: {
    title: `The Non Fictional`,
    author: {
      name: `Rūta Tučkutė`,
      summary: `I never felt like writing anything fictional.`,
    },
    description: `Personal space dedicated to photography and writings.`,
    siteUrl: `https://thenonfictional.com/`,
    social: {
      twitter: `@rutatuckute`,
    },
  },

  plugins: [
    // --- Core / images ---
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,

    `gatsby-plugin-sitemap`,

    {
      resolve: `gatsby-plugin-robots-txt`,
      options: {
        policy: [{ userAgent: `*`, allow: `/` }],
      },
    },

    // --- Content sources ---
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/photography`,
        name: `photography`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },

    // --- Markdown transformer ---
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 720,
              linkImagesToOriginal: false,
              showCaptions: true,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: `High Contrast`,
            },
          },

          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },

        // --- RSS feed ---
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) =>
              allMarkdownRemark.nodes.map((node) =>
                Object.assign({}, node.frontmatter, {
                  description: node.excerpt,
                  date: node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + node.fields.slug,
                  guid: site.siteMetadata.siteUrl + node.fields.slug,
                  custom_elements: [{ "content:encoded": node.html }],
                })
              ),
            query: `
              {
                allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
                  nodes {
                    excerpt
                    html
                    fields { slug }
                    frontmatter { title date }
                  }
                }
              }
            `,
            output: `/rss.xml`,
            title: `The Non Fictional — RSS`,
          },
        ],
      },
    },

    // --- PWA manifest ---
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `The Non Fictional`,
        short_name: `The Non Fictional`,
        start_url: `/`,
        background_color: `#000000`,
        theme_color: `#FFA500`,
        display: `minimal-ui`,
        icon: `src/images/logo.jpeg`,
      },
    },

    // Optional offline support (enable if you want PWA caching)
    // `gatsby-plugin-offline`,
  ],
}