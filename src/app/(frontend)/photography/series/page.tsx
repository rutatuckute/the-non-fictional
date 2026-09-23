import type { Metadata } from 'next'
import Link from 'next/link'

import Masthead from '../../../../components/masthead'
import PhotoImage from '../../../../components/photo-image'
import SiteFooter from '../../../../components/site-footer'
import PhotographyHeader from '../../../../components/photography/PhotographyHeader'
import { buildFrames, buildSeriesIndex } from '../../../../components/photography/photoData'
import { getPhotographs, getSeries } from '../../../../lib/content'
import styles from '../../../../styles/photography.module.css'

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

// A cover is shown at roughly half the content width on desktop, so twice that
// is the budget; the index is a page of stills and never opens the lightbox.
const COVER_PX = 1200

export default async function SeriesIndexPage() {
  const [nodes, series] = await Promise.all([getPhotographs(), getSeries()])
  const index = buildSeriesIndex(buildFrames(nodes), series)

  return (
    <div className={styles.page}>
      <Masthead activeSection="photography" />

      <main className={styles.main}>
        <PhotographyHeader active="series" />

        <div className={styles.stage}>
          <div className={styles.seriesIndex}>
            {index.map((entry: any) => (
              <Link
                className={styles.seriesCard}
                key={entry.slug}
                href={`/photography/series/${encodeURIComponent(entry.slug)}/`}
              >
                {entry.cover ? (
                  <PhotoImage
                    className={styles.seriesCover}
                    source={entry.cover.photo}
                    px={COVER_PX}
                    quality="normal"
                    alt={entry.title}
                    style={
                      entry.cover.width && entry.cover.height
                        ? { aspectRatio: `${entry.cover.width} / ${entry.cover.height}` }
                        : undefined
                    }
                  />
                ) : null}
                <span className={styles.seriesName}>{entry.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
