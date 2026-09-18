import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../../_og/card'

export const alt = 'I never felt like writing anything fictional.'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogCard({ kicker: 'In Brief', title: 'I never felt like writing anything fictional.' })
}
