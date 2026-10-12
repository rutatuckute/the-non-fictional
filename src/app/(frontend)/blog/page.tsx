import type { Metadata } from 'next'

import { getLibraryEntry, getPosts } from '../../../lib/content'
import WritingsIndex from './writings-index'

const description =
  'Essays and data pieces on The Non Fictional — questioning, starting with myself.'

export const metadata: Metadata = {
  title: 'Writings',
  description,
  alternates: { canonical: '/blog/' },
  openGraph: {
    title: 'Writings',
    description,
    url: '/blog/',
    type: 'website',
  },
}

export default async function WritingsPage() {
  const [posts, library] = await Promise.all([getPosts(), getLibraryEntry()])

  return <WritingsIndex posts={posts} library={library} />
}
