# AGENTS.md

## Project Context

- This is a personal website: Next.js 16 (App Router), TypeScript, with Payload 3
  as the CMS on Postgres.
- It is deployed to Vercel from GitHub. It was on Gatsby and Netlify until the
  migration; anything still describing that arrangement is out of date.
- The production branch for this repository is `master`, not `main`.
- Content lives in Payload, not in `content/`. That directory is kept as the
  migration source and is not read at build time.

## Change Guidelines

- Do not push directly to `master`; create a branch and open a pull request
  against `master`.
- Preserve existing content, URLs, and the general visual identity unless
  explicitly asked to change them. Every page URL ends in a slash, and the seven
  articles live at the site root — `trailingSlash` is on for that reason.
- Prefer small, focused pull requests with a clear purpose.
- Avoid unnecessary dependencies.

## Conventions

- The pages under `src/app/(frontend)/` fetch through `src/lib/content.ts`, which
  maps Payload documents into the node shape the layout components were written
  against. Change the mapper rather than the components.
- Interactive page bodies are client components colocated with their route; the
  route file itself stays a server component that fetches and passes data down.
- `/`, `/blog/`, `/photography/` and the articles are styled with CSS Modules;
  `/about/`, `/contacts/` and `404` use Tailwind and shadcn/ui under a `.tw`
  wrapper. Tailwind's Preflight is deliberately off — see `src/styles/globals.css`.
- Build image URLs with `imageUrl()` from `src/lib/images.ts`. It snaps widths
  onto the ladder declared in `next.config.mjs`; the optimizer rejects any width
  that is not on it.
- Schema changes need a migration committed with them
  (`npm run payload -- migrate:create <name>`). The Postgres adapter never
  pushes a schema, in development either.

## Validation

- Run `npm run typecheck` and `npm run build` before finishing. Both need a
  reachable `DATABASE_URI`.
- For responsive design work, check the site at 320px, 375px, 768px, 1024px, and
  1440px widths.
- Avoid horizontal scrolling on mobile.
- Avoid fixed-width containers that overflow.

## Pull Request Notes

Every pull request should include:

- Summary
- Changed files
- Assumptions
- Remaining limitations

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
