import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../_og/card'

export const alt = 'I need structure to think.'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogCard({ kicker: 'Photography · Writings', title: 'I need structure to think.' })
}
