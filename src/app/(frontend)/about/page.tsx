import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

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

// The profiles as line icons, drawn to one weight with the kit's marks, so X
// is no longer a text glyph beside two outlines.
const SOCIALS = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/ruta-tuckute/",
    icon: (
      <>
        <rect x="3" y="9" width="4" height="12" />
        <circle cx="5" cy="4.5" r="1.8" />
        <path d="M11 21V9h4v2a4 4 0 0 1 6 3.5V21h-4v-6a2 2 0 0 0-4 0" />
      </>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/the.nonfictional/",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.6" />
      </>
    ),
  },
  {
    name: "X",
    href: "https://x.com/rutatuckute",
    icon: (
      <>
        <path d="M4 4h4.5L20 20h-4.5z" />
        <path d="M19.5 4l-6.7 7.3" />
        <path d="M11.2 12.7L4.5 20" />
      </>
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/rutatuckute",
    icon: (
      <>
        <path d="M15 21v-3.5a3.4 3.4 0 0 0-1-2.6c3.2-.4 6-1.6 6-6.3a4.8 4.8 0 0 0-1.3-3.3 4.4 4.4 0 0 0-.1-3.3s-1.1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.7 1.7 5.6 2 5.6 2a4.4 4.4 0 0 0-.1 3.3A4.8 4.8 0 0 0 4.2 8.6c0 4.7 2.8 5.9 6 6.3a3.4 3.4 0 0 0-1 2.6V21" />
        <path d="M9.2 18.5c-3 .9-3.6-1.3-5.2-1.8" />
      </>
    ),
  },
]

const KitIcon = ({ children }: { children: ReactNode }) => (
  <svg className="brief-kit-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
)

// Broken after the @ on a narrow screen rather than mid-word.
const [emailUser, emailDomain] = site.author.email.split("@")

export default function AboutPage() {
  return (
    <div className="tw min-h-screen bg-background">
      <Masthead activeSection="in-brief" />

      <main className="mx-auto w-[var(--wide-width)] py-16 md:py-24">
        <div className="brief-layout">
          <article className="brief-essay">
            <h1 className="editorial-title brief-title">In brief</h1>

            <div className="brief-text">

              <p className="editorial-copy brief-intro font-serif text-lg leading-relaxed text-muted-foreground">
                I never felt like writing anything fictional. Contemplating the
                whats and whys of what's happening around me has always been a far
                more amusing playground. Must be a byproduct of spending so much
                time in my own head.
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                Now, more often than not, I get drained by the abundance. The
                abundance of information, content, and all the inputs that
                evolution hasn't had enough time to prepare our brains for. Worse
                yet, it's all becoming increasingly too much of the same.
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                I'm not fooled, though. Originality is indeed a myth. Everything
                is, and has always been, a copy of a copy. Or, more precisely, a
                recombination of the preexisting. That's just the natural
                evolutive state of things.
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                But what happens when that copy itself becomes homogeneous? When
                we outsource and thus transfer our thinking and curiosity - the
                very core of what got us here?
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                Why? It's tempting. Why would you refuse soma, after all?
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                But I don't want uniformity. I want differences. I want nuances. I
                want complexities. I want edges. I want rawness. I want the output
                of our imperfect neural networks and decoders. I want more of what
                makes us human. And all the discomfort that comes with it.
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                At least for now, I've found my anchors in this chaos - a kind of
                stability in motion, built on the eternal pursuit of control, even
                if illusory.{" "}
                <Link className="editorial-link" href="/blog/">
                  Writing
                </Link>{" "}
                feels a lot like solving problems.{" "}
                <Link className="editorial-link" href="/photography/">
                  Photography
                </Link>{" "}
                feels more like experiencing perceived reality as is.
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                I don't need to choose. I'm fine with both.
              </p>

              <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
                If anything, I wish to hurry through life a little less blindly,
                to experience it all a little bit more. To notice more. To share
                some of it with others, knowing that what we produce is just
                another way of assembling and decoding what's around us. To argue.
                To disagree. To interpret things differently. To develop through
                struggle rather than succumb to comfortable cognitive numbness.
              </p>

              <p className="editorial-copy brief-signoff font-serif text-lg leading-relaxed text-muted-foreground">
                I claim them all.
              </p>
            </div>
          </article>

          {/* The portrait with its contact beside it, both standing on one
              hairline: a figure and its caption. */}
          <aside className="brief-side" aria-label="Contact">
            <figure className="brief-figure">
              <ul className="brief-kit">
                <li>
                  <span className="brief-kit-head">
                    <KitIcon>
                      <rect x="3" y="6" width="18" height="12" />
                      <path d="M3 7l9 6 9-6" />
                    </KitIcon>
                    <span className="brief-kit-label">Write</span>
                  </span>
                  <a className="brief-email" href={`mailto:${site.author.email}`}>
                    {emailUser}@<wbr />
                    {emailDomain}
                  </a>
                </li>
                <li>
                  <span className="brief-kit-head">
                    <KitIcon>
                      <path d="M14 4h6v6" />
                      <path d="M20 4l-9 9" />
                      <path d="M18 14v6H4V6h6" />
                    </KitIcon>
                    <span className="brief-kit-label">Elsewhere</span>
                  </span>
                  <span className="brief-socials">
                    {SOCIALS.map(({ name, href, icon }) => (
                      <a
                        key={name}
                        className="brief-social"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={name}
                        title={name}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          {icon}
                        </svg>
                      </a>
                    ))}
                  </span>
                </li>
              </ul>

              <img
                className="brief-portrait"
                src={imageUrl("/images/uploads/in_brief_logo.png", 760, "normal")}
                alt=""
                width={352}
                height={528}
                loading="eager"
                decoding="async"
              />
            </figure>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
