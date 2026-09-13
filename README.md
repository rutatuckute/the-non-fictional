# The Non Fictional

Personal essays, reflections and photography by Rūta Tučkutė —
[thenonfictional.com](https://thenonfictional.com).

Next.js 16 (App Router) with Payload 3 as the CMS, on Postgres, deployed to
Vercel.

## Running it

```bash
npm install
cp .env.example .env        # fill in DATABASE_URI and PAYLOAD_SECRET
npm run payload -- migrate  # create the schema
npm run migrate:content     # import content/ into Payload (first run only)
npm run dev
```

The site is on <http://localhost:3000>, the admin panel on
<http://localhost:3000/admin>.

Any Postgres will do locally. Production runs on Neon, which is what Vercel's
Postgres integration provisions.

## How the content is arranged

Content lives in Payload, in two collections:

- **Writings** (`posts`) — published at the site root, `/<slug>/`.
- **Photography** (`photographs`) — no page of its own. Frames are shown in the
  lightbox on `/photography/`, and the old per-frame URLs redirect to
  `/photography/?frame=<slug>`.

Bodies are stored as **markdown**, and the older essays are largely raw HTML
inside that markdown. `src/lib/markdown.ts` renders them with rehype-raw, so
that HTML is passed through rather than escaped. This is deliberate: converting
those bodies to a rich text editor's format would not survive the round trip.

`content/` holds the markdown the site was originally built from. Nothing reads
it at build time any more — it is the migration source and the provenance of
every piece. `npm run migrate:content` is idempotent, matching on slug, so it
can be re-run to seed a new database.

### Images

Image files stay in the repository under `public/images/uploads/`, and the
collections store the path to one. They are resized on demand by Next's image
optimizer, so nothing is processed at build time.

Adding a photograph is therefore two steps: commit the file, then point an entry
at it in the admin panel. `npm run images:optimize` normalises a file to a web
master first, and the `Optimize images` workflow does it automatically on a
pull request.

To let the panel upload files directly instead, add a Payload uploads collection
backed by `@payloadcms/storage-vercel-blob`. Nothing here depends on the current
arrangement beyond the field being a text path.

## Deploying

Vercel, from `master`. Three environment variables:

| Variable | What it is |
| --- | --- |
| `DATABASE_URI` | Postgres connection string (Neon) |
| `PAYLOAD_SECRET` | Signs admin sessions — a long random string |
| `NEXT_PUBLIC_SITE_URL` | `https://thenonfictional.com` |

`NEXT_PUBLIC_CONTACT_EMAIL` overrides the address the contacts page links to.

`npm run build` applies database migrations and then builds, so a deploy brings
the schema up with it. Schema changes need a migration committed alongside
them — `npm run payload -- migrate:create <name>`; the adapter never pushes a
schema by itself, in development either.

## Checks

```bash
npm run typecheck
npm run build
```

For responsive work, check 320, 375, 768, 1024 and 1440px. No horizontal
scrolling on mobile, no fixed-width containers that overflow.
