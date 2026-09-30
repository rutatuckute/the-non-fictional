import type { Metadata } from 'next'
import Link from 'next/link'

import Masthead from '../../components/masthead'
import SiteFooter from '../../components/site-footer'
import { Button } from '../../components/ui/button'

export const metadata: Metadata = {
  title: '404: Not Found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="tw flex min-h-screen flex-col bg-background">
      <Masthead />

      <main className="mx-auto flex w-[var(--page-width)] flex-1 flex-col justify-center py-24">
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          404
        </p>
        <h1 className="editorial-title mt-4">Not found.</h1>
        <p className="mt-6 font-serif text-lg text-muted-foreground">
          You just hit a route that doesn&#39;t exist — the sadness.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Back to the front</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog/">Read the writings</Link>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
