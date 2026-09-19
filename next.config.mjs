import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every published URL on this site ends in a slash — /blog/, /about/, and the
  // seven articles at the site root. They are indexed and linked that way, so
  // the shape is kept rather than 301'd to a new one.
  trailingSlash: true,

  images: {
    // AVIF is deliberately not offered. Measured against real frames from this
    // archive, it only wins in a middle band: container overhead makes it
    // larger than WebP for small marks, and past ~700px it loses on both size
    // and encode time — at 2200px it came out a third larger and took 28x
    // longer. Next negotiates one format for the whole site, and the
    // photography page is dominated by large frames, so WebP is that format.
    formats: ['image/webp'],

    // The optimizer only honours widths it has been told about, and every
    // width this site asks for is listed here. imageUrl() in src/lib/images.ts
    // snaps any request onto this ladder, so a width can never be dropped
    // silently back to a default.
    deviceSizes: [640, 750, 828, 1080, 1200, 1680, 1920, 2048, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 256, 300, 384, 420, 560, 760],

    // The three quality steps the frames are served at. Next rejects any
    // quality not on this list.
    qualities: [50, 58, 70, 75],

    // Frames are served from the bucket's custom domain rather than from this
    // deployment, and the optimizer refuses to fetch from a host it has not
    // been told about. Everything else about the pipeline is unchanged: it
    // still resizes onto the ladder above and still negotiates WebP.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(
          process.env.NEXT_PUBLIC_MEDIA_URL || 'https://images.thenonfictional.com',
        ).hostname,
      },
    ],

    minimumCacheTTL: 31536000,
  },

  // The OG card reads its font files by path at render time, so nothing in the
  // bundle references them and tracing cannot infer them.
  outputFileTracingIncludes: {
    '/**': ['./src/app/_og/*.ttf'],
  },

  async redirects() {
    return [
      // The redesign prototype was folded into the homepage.
      { source: '/redesign-lab', destination: '/', permanent: true },
      // A leftover page from the Gatsby starter. It is in the old sitemap, so
      // it is sent somewhere real rather than left to 404.
      { source: '/using-typescript', destination: '/blog/', permanent: true },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
