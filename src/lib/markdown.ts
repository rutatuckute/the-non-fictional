import rehypePrettyCode from 'rehype-pretty-code'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkSmartypants from 'remark-smartypants'
import type { ThemeRegistrationRaw } from 'shiki'
import { createCssVariablesTheme } from 'shiki/core'
import { unified } from 'unified'

import { imageUrl } from './images'
import { slugify } from './slug'

export type Section = { id: string; label: string }

// The older essays are written almost entirely as raw HTML inside the markdown
// file — <p>, <blockquote>, <h4> and <img> tags, not markdown syntax. That is
// why allowDangerousHtml and rehype-raw are both on: without them the bodies
// would render as escaped text. The content is the author's own, from a panel
// only the author can sign into, so there is nothing here to sanitise against.
// The code is coloured in the site's own palette rather than an editor's: the
// highlighter writes each token's colour as a CSS variable (--code-token-*),
// and the article's stylesheet decides what those are — names in ink,
// keywords quieter, strings in the piece's form colour. Comments are italic.
const houseTheme = createCssVariablesTheme({ name: 'house', variablePrefix: '--code-' })
houseTheme.tokenColors = houseTheme.tokenColors?.map((rule) =>
  JSON.stringify(rule.scope).includes('"comment"')
    ? { ...rule, settings: { ...rule.settings, fontStyle: 'italic' } }
    : rule,
)

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  // Replaces gatsby-remark-vscode. The house theme above leaves the colours
  // to the stylesheet.
  .use(rehypePrettyCode, {
    theme: houseTheme as ThemeRegistrationRaw,
    keepBackground: false,
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

// The labels are taken from rendered HTML, where rehype-stringify has written
// "&" as "&#x26;". React escapes the label again when it renders it, so it has
// to be plain text here or the rail shows the entity itself.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
}

const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const point =
        code[1] === 'x' || code[1] === 'X'
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10)
      return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity
  })

// Every piece migrated from the Gatsby site opens with "- - -", a thematic break
// that renders as a rule directly under the one the page template draws after
// the dek. A break before any content separates nothing, so it is dropped.
const withoutLeadingRule = (html: string): string =>
  html.replace(/^\s*<hr\s*\/?>\s*/, '')

// The rail's section index is built from the piece's own headings, so each one
// needs an id to jump to. Done on the HTML string because the body arrives from
// markdown already rendered.
const withSectionIds = (html: string): { html: string; sections: Section[] } => {
  const sections: Section[] = []
  const marked = html.replace(
    /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (tag, level: string, attrs: string, inner: string) => {
      const label = decodeEntities(inner.replace(/<[^>]+>/g, '')).trim()
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

// The author's own highlights were painted by hand — green in the essays,
// orange in a data piece — which now clashes with the form colours the rest
// of the page uses. They become a class, and the article paints it in the
// piece's form colour. Only these two values are matched: the code
// highlighter's colours are CSS variables, so they never match.
const withFormHighlights = (html: string): string =>
  html.replace(/style="color:\s*(?:#8ac926|orange);?\s*"/gi, 'class="highlight"')

// The quotes were written by hand, three ways: the words in <p><em>, some
// wrapped in « », and the credit as a plain paragraph, a name and a link, or a
// bare link. The article sets one design for all of them, so they are handed
// over in one shape: the words with their outer marks taken off (the design
// sets the mark), and the credit as "Name · link". A quote that does not
// follow the pattern is left as written.
const withTidyQuotes = (html: string): string =>
  html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (whole, inner: string) => {
    const said = [...inner.matchAll(/<p>\s*<em>([\s\S]*?)<\/em>\s*<\/p>/g)].map((match) => match[1].trim())
    if (!said.length) return whole

    const credit = inner
      .replace(/<p>\s*<em>[\s\S]*?<\/em>\s*<\/p>/g, '')
      .trim()
      .replace(/^<p>|<\/p>$/g, '')
      .replace(/\s*<br\s*\/?>\s*/g, ' · ')
      .trim()
    const words = said
      .map((paragraph) => paragraph.replace(/^«\s*/, '').replace(/\s*»$/, ''))
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join('')

    return `<blockquote class="quote"><div class="quote-words">${words}</div>${
      credit ? `<footer class="quote-credit">${credit}</footer>` : ''
    }</blockquote>`
  })

// Each block gets a header — its language, its length and a Copy button —
// and, when it runs past twelve lines, a "Show all" to unfold it. The
// article's CodeBlocks component makes the two buttons work; without it the
// code simply shows in full.
const FOLD_AFTER = 12

const withCodeFrames = (html: string): string =>
  html.replace(
    /<figure data-rehype-pretty-code-figure="">([\s\S]*?)<\/figure>/g,
    (whole, inner: string) => {
      const language = inner.match(/data-language="([^"]+)"/)?.[1] || 'code'
      const lines = (inner.match(/<span data-line/g) || []).length
      const long = lines > FOLD_AFTER

      return `<figure class="code" data-lines="${lines}"${long ? ' data-long="true"' : ''}><div class="code-head"><span class="code-lang">${language}</span><span class="code-count">${lines} lines</span><button type="button" class="code-copy">Copy</button></div><div class="code-body">${inner}</div>${
        long ? `<button type="button" class="code-more" aria-expanded="false">Show all ${lines} lines</button>` : ''
      }</figure>`
    },
  )

export const renderMarkdown = async (
  body: string,
): Promise<{ html: string; sections: Section[] }> => {
  const file = await processor.process(body || '')

  return withSectionIds(withCodeFrames(withTidyQuotes(withFormHighlights(withResizedImages(withoutLeadingRule(String(file)))))))
}
