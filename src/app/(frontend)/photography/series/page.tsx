import type { Metadata } from 'next'

import PhotoSpace from '../../../../components/photo-space/PhotoSpace'
import { buildPhotoSpace } from '../../../../components/photo-space/space-data'
import { getPhotographs, getSeries } from '../../../../lib/content'

const description = 'Bodies of work on The Non Fictional.'

export const metadata: Metadata = {
  title: 'Series',
  description,
  alternates: { canonical: '/photography/series/' },
  openGraph: {
    title: 'Series',
    description,
    url: '/photography/series/',
    type: 'website',
  },
}

// The series are a stretch of the one Photography page; this address opens
// the page there.
export default async function SeriesIndexPage() {
  const [nodes, series] = await Promise.all([getPhotographs(), getSeries()])

  return <PhotoSpace space={buildPhotoSpace(nodes, series)} view="series" />
}
