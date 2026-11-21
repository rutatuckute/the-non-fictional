# What we say — verification, 21 November 2026

Implemented in the existing Next.js story worktree, preserving its runtime and visual identity. Loaded matrix-app-builder, matrix-design-system, emil-design-eng, and animate (SVG reference).

`npm run typecheck` and `npm run build` passed. No dependency or schema changes. This is a read-only article graphic, so no record persistence checks apply.

Headless Chromium exercised the actual draft at http://127.0.0.1:3200/chess-story/ in the site's dark theme at 320×640, 375×812, 768×1024, 1024×768, and 1440×900. All passed: stage changes, scroll-driven timeline reveal, backward scroll/jumps, graphic/card fit at the captured reading positions, no horizontal overflow, range Home/End, scatter pointer inspection, explanation disclosure, later username guessing, and reduced-motion state. No page JavaScript errors. Screenshots were visually inspected at desktop and phone widths and the compact layout was refined from those results.

Reproduce with `node chess-story/checks/say-ratings.cjs` in the data-stories repo. Screenshot evidence: `/tmp/chess-say-ratings/<width>-<stage>.png`. The data export is `chess-story/analysis/export_story_ratings.py` in the same repo; it packages the A1/A4 numbers from the existing prototype export. The supplied messages-07 mock was resized and encoded as WebP for the story.

Matrix shared Browser was unavailable; verification used the existing local Playwright setup. Physical devices and Matrix shell rendering were not checked. This remains the existing draft/preview; no production deployment was performed.

## Username blocks and pawn reveals

B1/B2 now form one interaction after the personal charts. Four anonymous pattern blocks reveal corresponding coloured pawn rows on selection. The desktop evidence column stays beside the blocks and the concluding interpretation; mobile results appear within the block just answered. Neutral five-pawn baselines, fractional fills, uncertainty ranges, editable choices, keyboard feedback and a concise live announcement are included. Scrolling never reveals an unanswered group. The overall takeaway waits until all four are answered. Answers are transient and are not stored.

`node chess-story/checks/say-usernames.cjs` passed at 320×640, 375×812, 768×1024, 1024×768 and 1440×900: initial hidden results, every group's reveal, fractional pawns, neutral baseline, changing answers, Enter/Space, score, desktop right-side/sticky fit, mobile inline placement, chapter state, reduced motion, and no horizontal overflow or page errors. Rendered phone and desktop screenshots were inspected and the sticky boundary refined. Evidence: `/tmp/chess-usernames/<width>-{empty,partial,complete,top}.png`.

The existing rating sequence passed `say-ratings.cjs` again at all five widths after the section restructuring. The legacy `say.cjs` no longer assumes a single username guess in its second chart card. Final typecheck and production build passed. No new dependencies, database changes or deployment.
