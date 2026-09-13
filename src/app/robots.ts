import type { MetadataRoute } from 'next'

import { absolute } from '../lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nothing behind the panel is public, and its routes are not content.
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: absolute('/sitemap.xml'),
    host: absolute('/'),
  }
}
