// What gatsby-config's siteMetadata used to hold. Everything that needs an
// absolute URL — canonicals, OG tags, the sitemap, the feed — comes from here.
const fromEnv = process.env.NEXT_PUBLIC_SITE_URL

export const siteUrl = (fromEnv || 'https://thenonfictional.com').replace(/\/$/, '')

export const site = {
  title: 'The Non Fictional',
  description: 'Personal space dedicated to photography and writings.',
  url: siteUrl,
  locale: 'en_GB',
  author: {
    name: 'Rūta Tučkutė',
    summary: 'I never felt like writing anything fictional.',
    // The old contact form posted to Netlify Forms and never exposed an
    // address, so there was none in the repository to carry over. This is a
    // sensible default on the site's own domain — confirm it resolves, or set
    // NEXT_PUBLIC_CONTACT_EMAIL to the address you actually read.
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@thenonfictional.com',
  },
  social: {
    twitter: '@rutatuckute',
  },
} as const

// Absolute URL for a site-root path. Every path on this site ends in a slash.
export const absolute = (path: string): string => {
  if (/^https?:\/\//.test(path)) return path
  const withSlash = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl}${withSlash}`
}
