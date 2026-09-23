import type { Metadata } from 'next'

import { getPhotographs } from '../../../../lib/content'
import ArchiveView from './archive-view'

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
  const nodes = await getPhotographs()

  return <ArchiveView nodes={nodes} />
}
