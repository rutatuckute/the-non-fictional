import type { Metadata } from "next"
import Link from "next/link"
import { Github, Linkedin } from "lucide-react"

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

      <main className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-20">
          <div className="max-w-xl">
            <h1 className="editorial-title">In brief</h1>

            <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
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
              very core fo what got us here?
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

            <p className="editorial-copy font-serif text-lg leading-relaxed text-muted-foreground">
              I claim them all.
            </p>
          </div>

          <figure className="justify-self-center md:justify-self-end">
            <img
              src={imageUrl("/images/uploads/in_brief_logo.png", 640, "normal")}
              alt=""
              width={320}
              height={480}
              className="h-auto w-80 rounded-xl border border-border"
              loading="eager"
              decoding="async"
            />

            <nav className="profile-socials" aria-label="Social profiles">
              <a
                className="profile-social-link"
                href="https://www.linkedin.com/in/ruta-tuckute/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin aria-hidden="true" />
              </a>
              <a
                className="profile-social-link"
                href="https://x.com/rutatuckute"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                <span className="profile-social-x" aria-hidden="true">
                  𝕏
                </span>
              </a>
              <a
                className="profile-social-link"
                href="https://github.com/rutatuckute"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github aria-hidden="true" />
              </a>
            </nav>
          </figure>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
