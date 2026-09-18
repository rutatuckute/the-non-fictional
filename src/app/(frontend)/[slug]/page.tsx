import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { getArticle, getPhotographSlugs, getPosts } from '../../../lib/content'
import { renderMarkdown } from '../../../lib/markdown'
import { absolute, site } from '../../../lib/site'
import Masthead from '../../../components/masthead'
import SiteFooter from '../../../components/site-footer'
import styles from '../../../styles/blog-post.module.css'

const FORMS: Record<string, string> = {
  essays: 'Essays',
  reflections: 'Reflections',
  data: 'Data',
}

// Both the articles, which live at the site root, and the photographs, whose
// old per-frame URLs still have to resolve. Anything else 404s.
export const dynamicParams = false

export async function generateStaticParams() {
  const [posts, frames] = await Promise.all([getPosts(), getPhotographSlugs()])

  return [
    ...posts.map((post) => ({ slug: post.fields.slug.replace(/^\/|\/$/g, '') })),
    ...frames.map((slug) => ({ slug })),
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(decodeURIComponent(slug))

  if (!article) return {}

  const fm = article.node.frontmatter
  const title = fm.title || 'Writing'
  const description = fm.excerpt || article.node.excerpt
  const path = article.node.fields.slug

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title,
      description,
      url: path,
      publishedTime: fm.date || undefined,
      authors: [site.author.name],
      tags: fm.tags,
      images: fm.cover_image ? [{ url: fm.cover_image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: fm.cover_image ? [fm.cover_image] : undefined,
    },
  }
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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  const article = await getArticle(decoded)

  // Photographs have no page of their own — the lightbox on the photography
  // page is the only place a frame is shown. The old per-photo URLs are indexed
  // and linked, so each one still resolves, to its frame in that lightbox.
  if (!article) {
    const frames = await getPhotographSlugs()

    if (frames.includes(decoded)) {
      permanentRedirect(`/photography/?frame=${encodeURIComponent(decoded)}`)
    }

    notFound()
  }

  const { node, dateLabel, previous, next } = article
  const fm = node.frontmatter
  const form = fm.category_id && FORMS[fm.category_id] ? fm.category_id : 'essays'
  const { html, sections } = await renderMarkdown(node.body || '')

  const url = absolute(node.fields.slug)
  const share = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    url,
  )}&text=${encodeURIComponent(fm.title || '')}`

  // Tells search engines this is an article, who wrote it and when — the old
  // build emitted only the schema.org microdata attributes below.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: fm.title,
    description: fm.excerpt || node.excerpt,
    datePublished: fm.date,
    author: { '@type': 'Person', name: site.author.name },
    publisher: { '@type': 'Person', name: site.author.name },
    mainEntityOfPage: url,
    ...(fm.cover_image ? { image: absolute(fm.cover_image) } : {}),
  }

  return (
    <div className={styles.page} data-form={form}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Masthead activeSection="writings" />

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
                <dd>{dateLabel}</dd>
              </div>
              <div>
                <dt>Length</dt>
                <dd>{node.timeToRead} min</dd>
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
                {sections.map((section) => (
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
              <Link className={styles.navItem} href={previous.slug} rel="prev">
                <span className={styles.navLabel}>Previous</span>
                <span className={styles.navTitle}>{previous.title}</span>
              </Link>
            ) : null}
            {next ? (
              <Link className={styles.navItem} href={next.slug} rel="next">
                <span className={styles.navLabel}>Next</span>
                <span className={styles.navTitle}>{next.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
