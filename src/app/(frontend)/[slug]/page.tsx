import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import type { ReactNode } from 'react'

import {
  getArticle,
  getPhotographSlugs,
  getPosts,
  type Neighbour,
  type SideNote,
  type Source,
} from '../../../lib/content'
import { imageUrl } from '../../../lib/images'
import { renderMarkdown } from '../../../lib/markdown'
import { splitStories, type Part } from '../../../lib/stories'
import { absolute, site } from '../../../lib/site'
import Masthead from '../../../components/masthead'
import { Glyph } from '../../../components/redesign/FieldKey'
import SiteFooter from '../../../components/site-footer'
import { StoryBlock, StoryFigure } from '../../../components/stories/StoryBlock'
import styles from '../../../styles/blog-post.module.css'
import ArticleContents from './article-contents'
import CodeBlocks from './code-blocks'

// The piece is set as a front page sets its lead: an opening spread of title
// and cover, then three columns — what it is and what it draws on, the text,
// and its contents and side note, which stay in view while it is read.
// Everything that carries colour takes the form's.

const FORM_ONE: Record<string, string> = {
  essays: 'Essay',
  reflections: 'Reflection',
  data: 'Data',
}
const FORMAT: Record<string, string> = {
  essays: 'essay',
  reflections: 'reflection',
  data: 'data',
}

const formOf = (id: string | null | undefined): string => (id && FORM_ONE[id] ? id : 'essays')
const capitalise = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

const SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

// The Library's kinds, in reading order, each with its line icon.
const KINDS: { id: string; label: string; icon: ReactNode }[] = [
  {
    id: 'books',
    label: 'Books',
    icon: (
      <>
        <path d="M3 6c3-1 6-1 9 1v13c-3-2-6-2-9-1z" />
        <path d="M21 6c-3-1-6-1-9 1v13c3-2 6-2 9-1z" />
      </>
    ),
  },
  {
    id: 'press',
    label: 'Articles',
    icon: (
      <>
        <rect x="3" y="5" width="14" height="14" />
        <path d="M17 8h4v9a2 2 0 0 1-2 2h-2" />
        <path d="M6 9h8" />
        <path d="M6 12h8" />
        <path d="M6 15h5" />
      </>
    ),
  },
  {
    id: 'film',
    label: 'Film',
    icon: (
      <>
        <rect x="3" y="6" width="13" height="12" />
        <path d="M16 10l5-3v10l-5-3" />
      </>
    ),
  },
  {
    id: 'music',
    label: 'Music',
    icon: (
      <>
        <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
        <rect x="3" y="14" width="4" height="6" />
        <rect x="17" y="14" width="4" height="6" />
      </>
    ),
  },
  {
    id: 'data',
    label: 'Research',
    icon: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="2.5" />
        <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
        <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
      </>
    ),
  },
]

const Icon = ({ children, className = styles.icon }: { children: ReactNode; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
)

const Mark = ({ form }: { form: string }) => (
  <svg className={styles.mark} viewBox="-10 -10 20 20" width="14" height="14" aria-hidden="true">
    <Glyph format={FORMAT[form]} />
  </svg>
)

const Byline = ({ form, minutes, topics = [] }: { form: string; minutes: number; topics?: string[] }) => (
  <p className={`${styles.label} ${styles.quiet} ${styles.byline}`}>
    <span className={styles.form} data-form={form}>
      <Mark form={form} />
      {FORM_ONE[form]}
    </span>
    <span aria-hidden="true">·</span> {minutes} min read
    {topics.length ? (
      <>
        <span aria-hidden="true">·</span> <span>{topics.join(' · ')}</span>
      </>
    ) : null}
  </p>
)

// What the piece draws on, grouped by kind, titles first.
const Library = ({ sources, className = '' }: { sources: Source[]; className?: string }) => {
  if (!sources.length) return null

  const groups = KINDS.map((kind) => ({ ...kind, list: sources.filter((source) => source.kind === kind.id) })).filter(
    (group) => group.list.length,
  )

  return (
    <section className={`${styles.library} ${className}`} aria-label="(Anti)library">
      <h2 className={`${styles.label} ${styles.libraryHead}`}>
        {/* A bookshelf: four spines of different heights, one leaning. */}
        <Icon className={styles.shelf}>
          <path d="M3 20h18" />
          <path d="M5 20V7h3v13" />
          <path d="M9 20V5h3v15" />
          <path d="M13 20V9h2.5v11" />
          <path d="M16.6 20l1.6-11.5 2.6.4L19.2 20" />
        </Icon>
        (Anti)library
      </h2>
      {groups.map((group) => (
        <div className={styles.group} key={group.id}>
          <p className={`${styles.label} ${styles.quiet} ${styles.groupHead}`}>
            <Icon>{group.icon}</Icon>
            {group.label}
          </p>
          <ul className={styles.entries}>
            {group.list.map((source) => {
              const meta = [source.author, source.year, source.publisher].filter(Boolean).join(' · ')
              const inner = (
                <>
                  <span className={styles.entryTitle}>{source.title}</span>
                  {meta ? <span className={styles.entryMeta}>{meta}</span> : null}
                </>
              )
              return (
                <li key={`${source.title}${source.url}`}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <span>{inner}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

// *word* in a note is set upright, as emphasis inside italic is.
const withEmphasis = (text: string): ReactNode[] =>
  text.split(/(\*[^*]+\*)/g).map((part, index) =>
    /^\*[^*]+\*$/.test(part) ? <em key={index}>{part.slice(1, -1)}</em> : part,
  )

// Set as the notes on Writings' (Anti)library are, the rule in the form's
// colour.
const Note = ({ note, className = '' }: { note: SideNote; className?: string }) => (
  <aside className={`${styles.note} ${className}`} aria-label={note.label}>
    <p className={`${styles.label} ${styles.noteHead}`}>
      <Icon>
        <path d="M4 20l1-4L16 5l3 3L8 19z" />
        <path d="M14 7l3 3" />
      </Icon>
      {note.label}
    </p>
    {note.paragraphs.map((paragraph) => (
      <p className={styles.noteText} key={paragraph}>
        {withEmphasis(paragraph)}
      </p>
    ))}
  </aside>
)

const Actions = ({ link, share }: { link: string | null; share: string }) => (
  <p className={styles.actions}>
    {link ? (
      <a href={link} rel="noopener noreferrer" target="_blank">
        <Icon>
          <path d="M8 7l-5 5 5 5" />
          <path d="M16 7l5 5-5 5" />
          <path d="M14 4l-4 16" />
        </Icon>
        Code
      </a>
    ) : null}
    <a href={share} rel="noopener noreferrer" target="_blank">
      <Icon>
        <path d="M4 4h4.5L20 20h-4.5z" />
        <path d="M19.5 4l-6.7 7.3" />
        <path d="M11.2 12.7L4.5 20" />
      </Icon>
      Share
    </a>
  </p>
)

const Card = ({ entry, side }: { entry: Neighbour; side: 'previous' | 'next' }) => {
  const form = formOf(entry.form)
  return (
    <Link className={styles.card} data-form={form} data-side={side} href={entry.slug} rel={side === 'next' ? 'next' : 'prev'}>
      {entry.cover ? (
        <span className={styles.cardCover}>
          <img src={imageUrl(entry.cover, 300, 'lighter')} alt="" loading="lazy" decoding="async" />
        </span>
      ) : null}
      <span className={styles.cardText}>
        <span className={`${styles.label} ${styles.quiet}`}>{side === 'next' ? 'Next →' : '← Previous'}</span>
        <span className={styles.cardTitle}>{entry.title}</span>
        <Byline form={form} minutes={entry.minutes} />
      </span>
    </Link>
  )
}

// Both the articles, which live at the site root, and the photographs, whose
// old per-frame URLs still have to resolve.
//
// Params are not closed, because content is authored in the panel rather than
// committed: a piece published after the last build has a slug this list
// cannot know about, and closing the set would 404 it until the next deploy.
// Anything genuinely unknown still 404s — the component falls through to
// notFound() when the slug matches neither an article nor a frame.
export const dynamicParams = true

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

// The prose of a piece, with any interactive figures set where the body
// marks them.
const Prose = ({ parts, articleBody = false }: { parts: Part[]; articleBody?: boolean }) => (
  <>
    {parts.map((part, index) =>
      part.kind === 'figure' ? (
        <StoryFigure key={index} name={part.name} />
      ) : (
        <div
          key={index}
          className={styles.prose}
          dangerouslySetInnerHTML={{ __html: part.html }}
          {...(articleBody && index === 0 ? { itemProp: 'articleBody' } : {})}
        />
      ),
    )}
  </>
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
  const form = formOf(fm.category_id)
  const topics = (fm.topic || '')
    .split('/')
    .map((topic) => topic.trim())
    .filter(Boolean)
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

  const hasContents = sections.length > 1
  const note = fm.side_note
  // The body, split where it marks a story: the first stretch of prose sits in
  // the columns; a story takes the page across; any prose after it returns to
  // the reading column.
  const blocks = splitStories(html)
  // A phone has no side columns: the library follows the piece, wherever it
  // ends. (The note and the actions go to the top; see the header.)
  const tail = <Library sources={fm.sources} className={styles.endOnly} />
  const first = blocks[0]?.kind === 'prose' ? blocks[0] : { kind: 'prose' as const, parts: [] }
  const rest = blocks[0]?.kind === 'prose' ? blocks.slice(1) : blocks

  return (
    <div className={styles.page} data-form={form}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Masthead activeSection="writings" />

      <main className={styles.main}>
        <article itemScope itemType="http://schema.org/Article">
          {/* The opening: the words on the left, the cover on the right, both
              standing on one hairline across the page. */}
          <header className={styles.spread}>
            <div className={styles.head}>
              <p className={styles.label}>
                <time dateTime={fm.date || undefined} itemProp="datePublished">
                  {fm.date ? SHORT.format(new Date(fm.date)) : dateLabel}
                </time>
                {fm.inquiry ? (
                  <>
                    {' '}
                    <span className={styles.in}>in</span> {capitalise(fm.inquiry)}
                  </>
                ) : null}
              </p>
              <h1 className={styles.title} itemProp="headline">
                {fm.title}
              </h1>
              {fm.excerpt ? <p className={styles.dek}>{fm.excerpt}</p> : null}
              {/* On a phone the left column is gone; its facts come back here. */}
              <div className={styles.phoneOnly}>
                <Byline form={form} minutes={node.timeToRead} topics={topics} />
              </div>
              {/* And what the right column holds — Code and Share, the side
                  note — comes up here too, before the piece, not after it. */}
              <div className={`${styles.phoneOnly} ${styles.phoneTop}`}>
                <Actions link={fm.link} share={share} />
                {note ? <Note note={note} /> : null}
              </div>
              {hasContents ? (
                <details className={styles.phoneContents}>
                  <summary className={`${styles.label} ${styles.quiet}`}>Contents</summary>
                  <ArticleContents sections={sections} heading={false} />
                </details>
              ) : null}
            </div>
            {fm.cover_image ? (
              <figure className={styles.cover}>
                <img
                  src={imageUrl(fm.cover_image, 1680, 'normal')}
                  alt=""
                  width={1600}
                  height={1200}
                  fetchPriority="high"
                  decoding="async"
                />
              </figure>
            ) : null}
          </header>

          <div className={styles.columns}>
            <aside className={styles.left}>
              <dl className={styles.facts}>
                <div>
                  <dt className={`${styles.label} ${styles.quiet}`}>Form</dt>
                  <dd className={styles.form} data-form={form}>
                    <Mark form={form} />
                    {FORM_ONE[form]}
                  </dd>
                </div>
                <div>
                  <dt className={`${styles.label} ${styles.quiet}`}>Length</dt>
                  <dd>{node.timeToRead} min read</dd>
                </div>
                {topics.length ? (
                  <div>
                    <dt className={`${styles.label} ${styles.quiet}`}>Topics</dt>
                    <dd className={styles.topics}>
                      {topics.map((topic) => (
                        <span key={topic}>{topic}</span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <Library sources={fm.sources} />
            </aside>

            <div className={styles.body}>
              <Prose parts={first.parts} articleBody />
              {html.includes('class="code"') ? <CodeBlocks /> : null}
              {rest.length ? null : tail}
            </div>

            {/* Held in view while the piece is read. */}
            <aside className={styles.right}>
              <div className={styles.held}>
                {hasContents ? <ArticleContents sections={sections} /> : null}
                {note ? <Note note={note} /> : null}
                <Actions link={fm.link} share={share} />
              </div>
            </aside>
          </div>

          {rest.map((block, index) =>
            block.kind === 'story' ? (
              <StoryBlock
                key={index}
                name={block.name}
                intro={block.intro}
                steps={block.steps}
                closing={block.closing}
              />
            ) : (
              <div key={index} className={`${styles.columns} ${styles.continued}`}>
                <div className={styles.left} aria-hidden="true" />
                <div className={styles.body}>
                  <Prose parts={block.parts} />
                </div>
                <div className={styles.right} aria-hidden="true" />
              </div>
            ),
          )}

          {/* After a story, the phone's closing matter follows it. */}
          {rest.length ? (
            <div className={`${styles.columns} ${styles.continued} ${styles.tail}`}>
              <div className={styles.left} aria-hidden="true" />
              <div className={styles.body}>{tail}</div>
              <div className={styles.right} aria-hidden="true" />
            </div>
          ) : null}
        </article>

        {previous || next ? (
          <nav className={styles.more} aria-label="More writings">
            {previous ? <Card entry={previous} side="previous" /> : <span />}
            {next ? <Card entry={next} side="next" /> : null}
          </nav>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
