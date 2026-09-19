// Payload writes straight to Postgres, but every page on this site is
// prerendered, so a save changes nothing a visitor can see until the pages
// built from that content are regenerated. These helpers close that gap: the
// collections call them after a write, naming the surfaces that content
// actually appears on.
//
// next/cache is imported lazily and the call is allowed to fail. The same
// config is loaded by the Payload CLI — migrations, generate:types — which runs
// outside a Next request, where there is no render cache to invalidate and
// revalidatePath throws. A save from the panel always has one, because the
// panel posts through this app's own route handlers.

const revalidate = async (paths: string[]): Promise<void> => {
  let revalidatePath: (path: string) => void

  try {
    ;({ revalidatePath } = await import('next/cache'))
  } catch {
    return
  }

  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch {
      // Outside a request context. Nothing is cached there either.
    }
  }
}

// A slug is stored bare; every route on this site carries a trailing slash, but
// revalidatePath matches the route pattern, which does not.
const asRoute = (slug: unknown): string | null =>
  typeof slug === 'string' && slug.trim() ? `/${slug.replace(/^\/|\/$/g, '')}` : null

// Both feeds list writings only, but the sitemap covers everything, so it is
// revalidated for either kind.
const ALWAYS = ['/', '/sitemap.xml']

export const revalidatePost = (slug: unknown, previousSlug?: unknown): Promise<void> =>
  revalidate(
    [...ALWAYS, '/blog', '/rss.xml', asRoute(slug), asRoute(previousSlug)].filter(
      (path): path is string => Boolean(path),
    ),
  )

// A frame has no page of its own. Its slug still names a route — the old
// per-photo URL, which redirects into the lightbox — so that route is
// regenerated alongside the photography page itself.
export const revalidatePhotograph = (slug: unknown, previousSlug?: unknown): Promise<void> =>
  revalidate(
    [...ALWAYS, '/photography', asRoute(slug), asRoute(previousSlug)].filter(
      (path): path is string => Boolean(path),
    ),
  )
