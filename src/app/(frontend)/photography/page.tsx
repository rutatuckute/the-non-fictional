import type { Metadata } from 'next'

import { getPhotographs } from '../../../lib/content'
import PhotographyArchive from './photography-archive'

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
  const nodes = await getPhotographs()

  return <PhotographyArchive nodes={nodes} />
}
