// Interactive stories live in the body as plain markers, so their words stay
// in the panel with the rest of the piece and only the graphics are code:
//
//   <!--figure:name-->            an interactive figure in the text column
//   <!--story:name-->             a scrolly story, across the page:
//     …heading and paragraph…       pinned beside the graphic
//   <!--step-->                     one per step, in order
//     …step text…
//   <!--closing-->                  optional, under the last step
//     …closing text…
//   <!--/story-->
//
// The markers survive the markdown pipeline as HTML comments; this splits the
// rendered HTML on them. A name with no component behind it falls back to its
// text (see StoryBlock), so nothing written is ever lost.
export type Part = { kind: 'html'; html: string } | { kind: 'figure'; name: string }

export type Block =
  | { kind: 'prose'; parts: Part[] }
  | { kind: 'story'; name: string; intro: string; steps: string[]; closing: string }

const STORY = /<!--story:([\w-]+)-->([\s\S]*?)<!--\/story-->/g
const FIGURE = /<!--figure:([\w-]+)-->/g

const proseParts = (html: string): Part[] => {
  const parts: Part[] = []
  let last = 0
  for (const match of html.matchAll(FIGURE)) {
    const before = html.slice(last, match.index)
    if (before.trim()) parts.push({ kind: 'html', html: before })
    parts.push({ kind: 'figure', name: match[1] })
    last = (match.index ?? 0) + match[0].length
  }
  const rest = html.slice(last)
  if (rest.trim()) parts.push({ kind: 'html', html: rest })
  return parts
}

export const splitStories = (html: string): Block[] => {
  const blocks: Block[] = []
  let last = 0
  for (const match of html.matchAll(STORY)) {
    const before = proseParts(html.slice(last, match.index))
    if (before.length) blocks.push({ kind: 'prose', parts: before })

    const [body, closing = ''] = match[2].split('<!--closing-->')
    const [intro, ...steps] = body.split('<!--step-->')
    blocks.push({
      kind: 'story',
      name: match[1],
      intro: intro.trim(),
      steps: steps.map((step) => step.trim()).filter(Boolean),
      closing: closing.trim(),
    })
    last = (match.index ?? 0) + match[0].length
  }
  const rest = proseParts(html.slice(last))
  if (rest.length) blocks.push({ kind: 'prose', parts: rest })
  return blocks
}
