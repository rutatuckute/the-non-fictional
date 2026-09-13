import type { Metadata, Viewport } from 'next'
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Merriweather,
  Montserrat,
  Source_Serif_4,
} from 'next/font/google'

import { site, siteUrl } from '../../lib/site'
import '../../styles/globals.css'

// These were loaded from fonts.googleapis.com by a stylesheet link in every
// page's head, which put a third-party round trip in front of first paint on
// every navigation. Self-hosted, they are served from this origin, preloaded,
// and matched with a metric fallback so nothing shifts as they arrive.
//
// latin-ext is not optional here: the author's name, half the place names in
// the archive and four of the frame titles are outside latin. next/font reads
// these calls statically, so every argument has to be a literal — no shared
// constant for the subset list.

const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-source-serif',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

// Referenced by the legacy base styles in style.css.
const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-montserrat',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.title,
    template: `%s | ${site.title}`,
  },
  description: site.description,
  applicationName: site.title,
  authors: [{ name: site.author.name }],
  creator: site.author.name,
  publisher: site.author.name,
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: `${site.title} — RSS` }],
    },
  },
  openGraph: {
    type: 'website',
    siteName: site.title,
    title: site.title,
    description: site.description,
    url: '/',
    locale: site.locale,
  },
  twitter: {
    card: 'summary_large_image',
    site: site.social.twitter,
    creator: site.social.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/images/logo.png',
  },
  // Served as a static file rather than through app/manifest.ts. With
  // trailingSlash on, the generated .webmanifest route answers 404 on the bare
  // path and redirects the slashed one straight back to it, so neither form
  // resolves. The manifest holds nothing dynamic, so a file in public/ is both
  // simpler and actually reachable.
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0a09',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fonts = [bricolage, sourceSerif, plexMono, montserrat, merriweather]
    .map((font) => font.variable)
    .join(' ')

  return (
    <html lang="en" className={fonts}>
      <body>{children}</body>
    </html>
  )
}
