import { getPosts } from '../../lib/content'
import { renderMarkdown } from '../../lib/markdown'
import { absolute, site } from '../../lib/site'

// Replaces gatsby-plugin-feed, at the same URL it published to, so anything
// already subscribed keeps working.
export const dynamic = 'force-static'

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export async function GET() {
  const posts = await getPosts()

  const items = await Promise.all(
    posts.map(async (post) => {
      const url = absolute(post.fields.slug)
      const fm = post.frontmatter
      // The feed carries the whole piece, as it always has.
      const { html } = await renderMarkdown(post.body || '')

      return [
        '    <item>',
        `      <title>${escape(fm.title || '')}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        fm.date ? `      <pubDate>${new Date(fm.date).toUTCString()}</pubDate>` : '',
        `      <description>${escape(fm.excerpt || post.excerpt)}</description>`,
        `      <content:encoded><![CDATA[${html}]]></content:encoded>`,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    }),
  )

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.title)} — RSS</title>
    <link>${absolute('/')}</link>
    <description>${escape(site.description)}</description>
    <language>en</language>
    <atom:link href="${absolute('/rss.xml')}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
