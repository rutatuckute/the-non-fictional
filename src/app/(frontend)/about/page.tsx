import type { Metadata } from "next"

import Masthead from "../../../components/masthead"
import SiteFooter from "../../../components/site-footer"
import { imageUrl } from "../../../lib/images"
import { site } from "../../../lib/site"

const description = `${site.author.name} — ${site.author.summary}`

export const metadata: Metadata = {
  title: "In Brief",
  description,
  alternates: { canonical: "/about/" },
  openGraph: {
    title: "In Brief",
    description,
    url: "/about/",
    type: "profile",
  },
}

export default function AboutPage() {
  return (
    <div className="tw min-h-screen bg-background">
      <Masthead activeSection="in-brief" />

      <main className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-start md:gap-16">
          <div className="max-w-xl">
            <h1 className="editorial-title">In Brief</h1>

            <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
              I never felt like writing anything fictional. Contemplating the
              whats and whys of what's happening around me has always been a far
              more amusing playground. Must be a byproduct of spending so much
              time in my own head.
            </p>
          </div>

          <figure className="justify-self-center md:justify-self-end">
            <img
              src={imageUrl(
                "/images/uploads/site-about-icon.png",
                640,
                "normal",
              )}
              alt=""
              width={240}
              height={240}
              className="h-60 w-60 rounded-xl border border-border object-cover"
              loading="eager"
              decoding="async"
            />
          </figure>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
