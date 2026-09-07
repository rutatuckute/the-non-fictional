import type { MetadataRoute } from 'next'

import { getPosts } from '../lib/content'
import { absolute } from '../lib/site'

// Only canonical, indexable URLs. The old per-photograph URLs are permanent
// redirects into the lightbox and do not belong in a sitemap, and neither does
// a frame that has no page of its own.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts()

  const newest = posts.reduce<Date | undefined>((latest, post) => {
    if (!post.frontmatter.date) return latest
    const date = new Date(post.frontmatter.date)
    return !latest || date > latest ? date : latest
  }, undefined)

  const sections: MetadataRoute.Sitemap = [
    { url: absolute('/'), changeFrequency: 'monthly', priority: 1, lastModified: newest },
    { url: absolute('/blog/'), changeFrequency: 'monthly', priority: 0.9, lastModified: newest },
    { url: absolute('/photography/'), changeFrequency: 'monthly', priority: 0.9 },
    { url: absolute('/about/'), changeFrequency: 'yearly', priority: 0.5 },
    { url: absolute('/contacts/'), changeFrequency: 'yearly', priority: 0.4 },
  ]

  const articles: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absolute(post.fields.slug),
    lastModified: post.frontmatter.date ? new Date(post.frontmatter.date) : undefined,
    changeFrequency: 'yearly',
    priority: 0.8,
  }))

  return [...sections, ...articles]
}
