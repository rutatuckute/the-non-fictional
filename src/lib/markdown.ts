import rehypePrettyCode from 'rehype-pretty-code'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkSmartypants from 'remark-smartypants'
import { unified } from 'unified'

import { imageUrl } from './images'
import { slugify } from './slug'

export type Section = { id: string; label: string }

// The older essays are written almost entirely as raw HTML inside the markdown
// file — <p>, <blockquote>, <h4> and <img> tags, not markdown syntax. That is
// why allowDangerousHtml and rehype-raw are both on: without them the bodies
// would render as escaped text. The content is the author's own, from a panel
// only the author can sign into, so there is nothing here to sanitise against.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  // Replaces gatsby-remark-vscode. Shiki writes the colours inline, so unlike
  // the old Prism stylesheet there is no theme CSS to keep in sync.
  .use(rehypePrettyCode, {
    theme: 'dark-plus',
    keepBackground: true,
  })
  .use(rehypeStringify, { allowDangerousHtml: true })

// Markdown bodies write plain <img> tags with an explicit width, so they never
// pass through the PhotoImage component. Rewrite their sources onto the same
// optimizer the rest of the site uses, budgeting twice the declared width for
// 2x screens — otherwise an icon declared at 30px still pulls a full-size
// master.
const withResizedImages = (html: string): string =>
  html.replace(
    /<img([^>]*?)src=["'](\/images\/uploads\/[^"']+)["']([^>]*?)>/g,
    (tag, before: string, src: string, after: string) => {
      if (src.endsWith('.svg')) {
        return tag
      }

      const declared = `${before} ${after}`.match(/width=["']?(\d+)/)
      const px = Math.min(declared ? Number(declared[1]) * 2 : 1440, 2560)

      // This markup is injected as a string, so there is no React handler to
      // hang a fallback on — an inline one keeps these images as resilient as
      // the rest, dropping back to the file in the repository if the optimizer
      // does not answer.
      const fallback = `this.onerror=null;this.src='${src}'`

      return `<img${before}src="${imageUrl(src, px, 'normal').replace(
        /&/g,
        '&amp;',
      )}" loading="lazy" decoding="async" onerror="${fallback}"${after}>`
    },
  )

// The rail's section index is built from the piece's own headings, so each one
// needs an id to jump to. Done on the HTML string because the body arrives from
// markdown already rendered.
const withSectionIds = (html: string): { html: string; sections: Section[] } => {
  const sections: Section[] = []
  const marked = html.replace(
    /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (tag, level: string, attrs: string, inner: string) => {
      const label = inner.replace(/<[^>]+>/g, '').trim()
      if (!label) {
        return tag
      }

      const id = `${slugify(label) || 'section'}-${sections.length + 1}`
      sections.push({ id, label })
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`
    },
  )

  return { html: marked, sections }
}

export const renderMarkdown = async (
  body: string,
): Promise<{ html: string; sections: Section[] }> => {
  const file = await processor.process(body || '')

  return withSectionIds(withResizedImages(String(file)))
}
