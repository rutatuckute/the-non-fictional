import type { Metadata } from 'next'

import PhotoSpace from '../../../components/photo-space/PhotoSpace'
import { buildPhotoSpace } from '../../../components/photo-space/space-data'
import { getPhotographs, getSeries } from '../../../lib/content'

const description =
  'Photography on The Non Fictional — shot on film, in Vilnius, Paris and elsewhere.'

export const metadata: Metadata = {
  title: 'Photography',
  description,
  alternates: { canonical: '/photography/' },
  openGraph: {
    title: 'Photography',
    description,
    url: '/photography/',
    type: 'website',
  },
}

export default async function PhotographyPage() {
  const [nodes, series] = await Promise.all([getPhotographs(), getSeries()])

  return <PhotoSpace space={buildPhotoSpace(nodes, series)} />
}
