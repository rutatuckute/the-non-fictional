import type { Metadata } from 'next'

import HomeSpace from '../../components/home-space/HomeSpace'
import { buildSpace } from '../../components/home-space/space-data'
import { getAllNodes } from '../../lib/content'
import { site } from '../../lib/site'

export const metadata: Metadata = {
  // The site name is the whole title here rather than "Home | The Non
  // Fictional", so the tab and the search result read as the site itself.
  title: site.title,
  description: site.description,
  alternates: { canonical: '/' },
  openGraph: {
    title: site.title,
    description: site.description,
    url: '/',
  },
}

export default async function HomePage() {
  const nodes = await getAllNodes()

  return <HomeSpace space={buildSpace(nodes)} />
}
