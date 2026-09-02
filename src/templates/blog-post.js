import * as React from "react"
import { Link, graphql } from "gatsby"

import Masthead from "../components/masthead"
import SiteFooter from "../components/site-footer"
import { photoUrl } from "../components/photography/photoData"
import * as styles from "./blog-post.module.css"

const FORMS = {
  essays: "Essays",
  reflections: "Reflections",
  data: "Data",
}

// Markdown bodies write plain <img> tags with an explicit width, so they never
// pass through PhotoImage. Rewrite their sources onto the same Image CDN the
// rest of the site uses, budgeting twice the declared width for 2x screens —
// otherwise an icon declared at 30px still pulls a full-size master.
const withResizedImages = html =>
  html.replace(
    /<img([^>]*?)src=["'](\/images\/uploads\/[^"']+)["']([^>]*?)>/g,
    (tag, before, src, after) => {
      if (src.endsWith(".svg")) {
        return tag
      }

      const declared = `${before} ${after}`.match(/width=["']?(\d+)/)
      const px = Math.min(declared ? Number(declared[1]) * 2 : 1440, 2560)

      // This markup is injected as a string, so there is no React handler to
      // hang a fallback on — an inline one keeps these images as resilient as
      // the rest, dropping to the file in the repo if the CDN does not answer.
      const fallback = `this.onerror=null;this.src='${src}'`

      return `<img${before}src="${photoUrl(src, px, "normal").replace(
        /&/g,
        "&amp;"
      )}" loading="lazy" decoding="async" onerror="${fallback}"${after}>`
    }
  )

const slugify = text =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

// The rail's section index is built from the piece's own headings, so each one
// needs an id to jump to. Done on the HTML string because the body arrives from
// markdown already rendered.
const withSectionIds = html => {
  const sections = []
  const marked = html.replace(
    /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (tag, level, attrs, inner) => {
      const label = inner.replace(/<[^>]+>/g, "").trim()
      if (!label) {
        return tag
      }

      const id = `${slugify(label) || "section"}-${sections.length + 1}`
      sections.push({ id, label })
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`
    }
  )

  return { html: marked, sections }
}

const GithubIcon = () => (
  <svg className={styles.actionIcon} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

const ShareIcon = () => (
  <svg className={styles.actionIcon} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M9.29 6.77 14.9 0h-1.33L8.7 5.88 4.81 0H0l5.88 8.9L0 16h1.33l5.14-6.21L10.58 16h4.81L9.29 6.77Zm-1.82 2.2-.6-.9L1.81 1.04h2.04l3.83 5.77.6.9 4.97 7.48h-2.04L7.47 8.97Z" />
  </svg>
)

const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.markdownRemark
  const site = data.site.siteMetadata
  const fm = post.frontmatter || {}
  const { previous, next } = pageContext

  const form = FORMS[fm.category_id] ? fm.category_id : "essays"
  const { html, sections } = React.useMemo(
    () => withSectionIds(withResizedImages(post.html)),
    [post.html]
  )

  // The old control pointed at twitter.com/share carrying neither a url nor
  // any text, so it opened an empty composer and never shared the piece. It
  // also pulled in widgets.js on every article, which the link does not need.
  const url = `${site.siteUrl}${post.fields.slug}`
  const share = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    url
  )}&text=${encodeURIComponent(fm.title || "")}`

  return (
    <div className={styles.page} data-form={form}>
      <Masthead location={location} activeSection="writings" />

      <main className={styles.main}>
        <article
          className={styles.article}
          itemScope
          itemType="http://schema.org/Article"
        >
          <aside className={styles.rail}>
            <dl className={styles.meta}>
              <div>
                <dt>Form</dt>
                <dd className={styles.metaForm}>{FORMS[form]}</dd>
              </div>
              {fm.inquiry ? (
                <div>
                  <dt>Inquiry</dt>
                  <dd>{fm.inquiry}</dd>
                </div>
              ) : null}
              <div>
                <dt>Published</dt>
                <dd>{fm.date}</dd>
              </div>
              <div>
                <dt>Length</dt>
                <dd>{post.timeToRead} min</dd>
              </div>
              {fm.topic ? (
                <div>
                  <dt>Topic</dt>
                  <dd>{fm.topic}</dd>
                </div>
              ) : null}
            </dl>

            {sections.length > 1 ? (
              <nav className={styles.sections} aria-label="Sections">
                {sections.map(section => (
                  <a key={section.id} href={`#${section.id}`}>
                    {section.label}
                  </a>
                ))}
              </nav>
            ) : null}

            <div className={styles.actions}>
              {fm.link ? (
                <a
                  className={styles.action}
                  href={fm.link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <GithubIcon />
                  Code
                </a>
              ) : null}
              <a
                className={styles.action}
                href={share}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ShareIcon />
                Share
              </a>
            </div>
          </aside>

          <div className={styles.body}>
            <h1 className={styles.title} itemProp="headline">
              {fm.title}
            </h1>
            {fm.excerpt ? <p className={styles.dek}>{fm.excerpt}</p> : null}
            <div className={styles.rule} />
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: html }}
              itemProp="articleBody"
            />
          </div>
        </article>

        {previous || next ? (
          <nav className={styles.nav} aria-label="More writings">
            {previous ? (
              <Link className={styles.navItem} to={previous.fields.slug} rel="prev">
                <span className={styles.navLabel}>Previous</span>
                <span className={styles.navTitle}>
                  {previous.frontmatter.title}
                </span>
              </Link>
            ) : null}
            {next ? (
              <Link className={styles.navItem} to={next.fields.slug} rel="next">
                <span className={styles.navLabel}>Next</span>
                <span className={styles.navTitle}>{next.frontmatter.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}

export default BlogPostTemplate

export const Head = ({ data }) => {
  const siteTitle = data.site.siteMetadata?.title || "The Non Fictional"
  const post = data.markdownRemark
  const canonical = `${data.site.siteMetadata.siteUrl}${post.fields.slug}`

  return (
    <>
      <title>
        {post.frontmatter.title} | {siteTitle}
      </title>
      <link rel="canonical" href={canonical} />
      <meta
        name="description"
        content={post.frontmatter.excerpt || post.excerpt}
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400&display=swap"
      />
    </>
  )
}

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        siteUrl
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 200)
      html
      timeToRead
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "D MMMM YYYY")
        excerpt
        cover_image
        category
        category_id
        inquiry
        topic
        link
      }
    }
  }
`
