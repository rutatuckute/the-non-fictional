import type { Metadata } from 'next'
import { Mail } from 'lucide-react'

import Masthead from '../../../components/masthead'
import SiteFooter from '../../../components/site-footer'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { site } from '../../../lib/site'

const description = 'Get in touch with The Non Fictional.'

export const metadata: Metadata = {
  title: 'Contacts',
  description,
  alternates: { canonical: '/contacts/' },
  openGraph: {
    title: 'Contacts',
    description,
    url: '/contacts/',
    type: 'website',
  },
}

// The form this page used to carry posted to Netlify Forms, which does not
// exist off Netlify. Rather than stand up a mail service to deliver what was
// always a plain message, the page hands over the address.
export default function ContactsPage() {
  const twitterHandle = site.social.twitter.replace('@', '')

  return (
    <div className="tw min-h-screen bg-background">
      <Masthead />

      <main className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Contacts
        </p>

        <h1 className="mt-4 font-sans text-4xl leading-[1.05] font-extrabold tracking-tight text-foreground md:text-5xl">
          Argue with me.
        </h1>

        <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
          Corrections, disagreements and anything worth questioning are all
          welcome. The fastest way through is email.
        </p>

        <Card className="mt-10">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
                Email
              </p>
              <p className="mt-1 font-serif text-lg text-foreground">
                {site.author.email}
              </p>
            </div>

            <Button asChild size="lg">
              <a href={`mailto:${site.author.email}`}>
                <Mail aria-hidden="true" />
                Write to me
              </a>
            </Button>
          </CardContent>
        </Card>

        <p className="mt-8 font-serif text-base text-muted-foreground">
          Also on{' '}
          <a
            href={`https://x.com/${twitterHandle}`}
            rel="me noopener noreferrer"
            target="_blank"
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            {site.social.twitter}
          </a>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
