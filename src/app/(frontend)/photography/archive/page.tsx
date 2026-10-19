import type { Metadata } from 'next'

import PhotoSpace from '../../../../components/photo-space/PhotoSpace'
import { buildPhotoSpace } from '../../../../components/photo-space/space-data'
import { getPhotographs, getSeries } from '../../../../lib/content'

const description = 'The complete photographic archive on The Non Fictional.'

export const metadata: Metadata = {
  title: 'Archive',
  description,
  alternates: { canonical: '/photography/archive/' },
  openGraph: {
    title: 'Archive',
    description,
    url: '/photography/archive/',
    type: 'website',
  },
}

export default async function ArchivePage() {
  const [nodes, series] = await Promise.all([getPhotographs(), getSeries()])

  // The archive is a stretch of the one Photography page; this address opens
  // the page there.
  return <PhotoSpace space={buildPhotoSpace(nodes, series)} view="archive" />
}
