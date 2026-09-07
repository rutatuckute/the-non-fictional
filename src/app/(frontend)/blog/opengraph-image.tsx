import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/card'

export const alt = 'Making sense out of it.'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogCard({ kicker: 'Writings', title: 'Making sense out of it.' })
}
