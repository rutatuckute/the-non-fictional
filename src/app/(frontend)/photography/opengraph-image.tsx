import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/card'

export const alt = 'On film, for a reason.'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogCard({ kicker: 'Photography', title: 'On film, for a reason.' })
}
