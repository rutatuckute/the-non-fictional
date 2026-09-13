// The bodies are markdown with a lot of raw HTML in them. Counting words in the
// source would count tag names, so the markup is stripped first — otherwise the
// older essays, which are almost entirely <p> tags, read as far longer than
// they are.
const WORDS_PER_MINUTE = 200

export const readingMinutes = (body: string): number => {
  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_>`~\-]+/g, ' ')

  const words = text.split(/\s+/).filter(Boolean).length

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}
