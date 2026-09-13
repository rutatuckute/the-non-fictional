import type { Metadata } from 'next'
import Link from 'next/link'

import Masthead from '../../../components/masthead'
import SiteFooter from '../../../components/site-footer'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { imageUrl } from '../../../lib/images'
import { site } from '../../../lib/site'

const description = `${site.author.name} — ${site.author.summary}`

export const metadata: Metadata = {
  title: 'In Brief',
  description,
  alternates: { canonical: '/about/' },
  openGraph: {
    title: 'In Brief',
    description,
    url: '/about/',
    type: 'profile',
  },
}

// The four forms the archive is built out of. The same words the homepage and
// the writings index use, so the site describes itself the same way throughout.
const FORMS = [
  { name: 'Essays', note: 'How things work, argued at length.' },
  { name: 'Reflections', note: '(Un)structured, and the less finished for it.' },
  { name: 'Data', note: 'The stories a dataset will admit to.' },
  { name: 'Photography', note: 'On film, for a reason.' },
]

export default function AboutPage() {
  return (
    <div className="tw min-h-screen bg-background">
      <Masthead activeSection="in-brief" />

      <main className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-start md:gap-16">
          <div className="max-w-xl">
            <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
              In Brief
            </p>

            <h1 className="mt-4 font-sans text-4xl leading-[1.05] font-extrabold tracking-tight text-foreground md:text-5xl">
              I never felt like writing anything fictional.
            </h1>

            <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
              A personal space for photography and writings — essays about how
              things work, (un)structured reflections, the stories data can
              tell, and photographs on film. Only questioning, starting with
              myself.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/blog/">Read the writings</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/photography/">See the photography</Link>
              </Button>
            </div>
          </div>

          <figure className="justify-self-center md:justify-self-end">
            <img
              src={imageUrl('/images/uploads/site-about-icon.png', 640, 'normal')}
              alt=""
              width={240}
              height={240}
              className="h-60 w-60 rounded-xl border border-border object-cover"
              loading="eager"
              decoding="async"
            />
          </figure>
        </div>

        <section className="mt-20" aria-labelledby="forms-heading">
          <h2
            id="forms-heading"
            className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase"
          >
            What is here
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FORMS.map((form) => (
              <Card key={form.name}>
                <CardContent>
                  <Badge variant="outline" className="font-mono">
                    {form.name}
                  </Badge>
                  <p className="mt-3 font-serif text-base leading-relaxed text-muted-foreground">
                    {form.note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-border pt-8">
          <p className="font-serif text-base text-muted-foreground">
            Disagree with any of it?{' '}
            <Link
              href="/contacts/"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              Argue with me.
            </Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
