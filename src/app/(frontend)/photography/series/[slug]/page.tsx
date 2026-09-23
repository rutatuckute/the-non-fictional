import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { buildFrames, framesInSeries } from '../../../../../components/photography/photoData'
import { getPhotographs, getSeries } from '../../../../../lib/content'
import SeriesView from './series-view'

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const series = await getSeries()

  return series.map((entry) => ({ slug: entry.slug }))
}

const findSeries = async (raw: string) => {
  const slug = decodeURIComponent(raw)
  const series = await getSeries()

  return series.find((entry) => entry.slug === slug) ?? null
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const entry = await findSeries(slug)

  if (!entry) return {}

  const path = `/photography/series/${encodeURIComponent(entry.slug)}/`

  return {
    title: entry.title,
    alternates: { canonical: path },
    openGraph: { title: entry.title, url: path, type: 'website' },
  }
}

export default async function SeriesPage({ params }: Args) {
  const { slug } = await params
  const entry = await findSeries(slug)

  if (!entry) notFound()

  const frames = framesInSeries(buildFrames(await getPhotographs()), entry.slug)

  // A series document with nothing in it yet is not a page worth publishing.
  if (!frames.length) notFound()

  return <SeriesView title={entry.title} frames={frames} />
}
