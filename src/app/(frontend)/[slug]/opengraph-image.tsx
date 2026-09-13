import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/card'
import { getArticle } from '../../../lib/content'
import { site } from '../../../lib/site'

export const alt = site.title
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const FORMS: Record<string, string> = {
  essays: 'Essay',
  reflections: 'Reflection',
  data: 'Data',
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticle(decodeURIComponent(slug))

  // Photograph slugs resolve here too, on their way to the lightbox. They have
  // no article behind them, so they take the site's own card.
  if (!article) {
    return ogCard({ kicker: 'Photography · Writings', title: site.title })
  }

  const fm = article.node.frontmatter
  const form = fm.category_id ? (FORMS[fm.category_id] ?? 'Essay') : 'Essay'
  const meta = [fm.inquiry, article.dateLabel, `${article.node.timeToRead} min`]
    .filter(Boolean)
    .join('  ·  ')

  return ogCard({
    kicker: form,
    title: fm.title || site.title,
    meta,
  })
}
