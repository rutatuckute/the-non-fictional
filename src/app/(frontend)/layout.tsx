import type { Metadata, Viewport } from "next"
import { Inter, Newsreader } from "next/font/google"

import { site, siteUrl } from "../../lib/site"
import "../../styles/globals.css"

// Both faces are self-hosted by next/font, served from this origin and
// preloaded, so neither adds a third-party request on navigation.
//
// Newsreader is the editorial face. It used to be a stack of whatever serif the
// device had installed (Iowan, then Palatino, then Georgia), which rendered as
// a Times look-alike on Android and Linux and made the tight display tracking
// collide. Its optical-size axis lets one family set both the 90px hero and the
// 19px body text properly. Inter is the functional face for labels and details.
//
// latin-ext is not optional here: the author's name, half the place names in
// the archive and four of the frame titles are outside latin. next/font reads
// these calls statically, so every argument has to be a literal — no shared
// constant for the subset list.

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
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
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/rss.xml", title: `${site.title} — RSS` },
      ],
    },
  },
  openGraph: {
    type: "website",
    siteName: site.title,
    title: site.title,
    description: site.description,
    url: "/",
    locale: site.locale,
  },
  twitter: {
    card: "summary_large_image",
    site: site.social.twitter,
    creator: site.social.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
  // Served as a static file rather than through app/manifest.ts. With
  // trailingSlash on, the generated .webmanifest route answers 404 on the bare
  // path and redirects the slashed one straight back to it, so neither form
  // resolves. The manifest holds nothing dynamic, so a file in public/ is both
  // simpler and actually reachable.
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#11100f",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
