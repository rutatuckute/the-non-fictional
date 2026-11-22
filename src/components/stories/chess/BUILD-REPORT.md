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

## 22 November — scene and colour refinements

Changed active navigation dots/progress and all coloured chart highlights to data green. The four illustrative phone games now have distinct legal positions and clock pairs. The professor's balloon sits further left with centred text. The investigation's message is live text over the blank phone, enlarging beyond its edges with scroll; reduced motion displays the final pop-out state without movement.

`scene-refinements.cjs` passed at 320×640, 375×812, 768×1024, 1024×768 and 1440×900, verifying four legal FEN positions and clock pairs, reverse scroll, computed navigation/chart/pawn colours, balloon centring and fit, message overlap beyond the phone while clearing its narrative card, viewport fit, and reduced motion. No JavaScript errors or horizontal overflow. Screenshots inspected on desktop and phone; evidence is `/tmp/chess-refinements/<width>-{opponent,professor,message}.png`. Final typecheck and production build passed. The positions are illustrative, not attributed game records. No new dependencies or database changes.

## Chess.com time chart — continuous red thread

Restored the time-in-games chart's measured line, legend key and questions to the narrative thread's clay red. Investigation charts and navigation retain data green. During the phone transition, a stage-local continuation joins the original page thread at the stage's top edge, follows a clear gutter into the phone, and leads into the measured chart line. It follows the same scroll state in both directions.

`time-thread.cjs` passed at 320×640, 375×812, 768×1024, 1024×768 and 1440×900 through nine forward/reverse positions: the incoming join matches within 0.1px, the continuation ends inside the phone, chart and legend colours match, no line crosses the visible text or axis labels, and every original data point remains in the measured path at its existing precision. Reduced motion and no horizontal overflow/JavaScript errors were checked. Screenshots in `/tmp/chess-time-thread/` were inspected on phone and desktop. Final typecheck and production build passed. The earlier scene refinement check now expects the time-chart colour exception.

## The thread — opening and object sequence, 22 November 2026

Rebuilt the first chapter to reach the people heading after 5.69 desktop screen heights (1024×768 and 1440×900). The title precedes both opening sentences on load, with metadata moved to the method. A recognisable device edge appears on desktop; the device starts below the opening on mobile. The supplied cover photograph is delivered as two optimised WebPs (about 63 KB total) and becomes the back of the folding left half. Reduced motion replaces the open state directly with the closed cover.

The two-line years pause is now the chapter's largest type, aligned to the opening, with the wooden set approaching below it. Desktop pins the set briefly alongside independently placed passages; mobile uses a static image above the passages. One persistent phone stage covers the readable first-game screenshot, the complete time chart, closing sentence, and return to a new opponent beside the people heading. The later people texts also keep their own positions in page flow.

Verified source evidence locally: earliest archived game is 29 April 2023, live/76533836973, 1. e4 Nf6, 1–0 by resignation; the ratings match the screenshot. The time series is recorded PGN start/end elapsed live-game minutes, not screen time. The export applies a Gaussian with σ=10 days and offsets −40…40, edge-renormalised, then retains weekly samples and the exact peak. Peak: 102.8 minutes/day on 23 March 2026. Every exported point is preserved. Removed the social-media estimate, legend and question marks; the direct annotation identifies a smoothed peak, and the caption names the 81-day smoothing window and exclusions.

Validation: `npm run typecheck`, `npm run build`, and `git diff --check` passed. Headless Chromium at 320×640, 375×812, 768×1024, 1024×768 and 1440×900 verified first-screen text/object visibility, closure, large aligned years text, independent wooden paragraphs, responsive image positioning, readable full-size phone, full red data line, exact phone-to-chart position, preserved points, reverse scroll, next-opponent return, chapter jumps, reduced motion, no horizontal overflow and no page errors. Evidence: `/tmp/chess-opening-verified/`. Regression checks at all five widths passed for four legal illustrative opponent positions/clocks, centred professor bubble, message pop-out, green navigation/rating/pawn charts and editable username guesses. Shared Matrix Browser control was unavailable; rendered verification used local headless Chromium. No physical-device testing. No new dependencies, records, database schema or production publication.

## 22 November — the thread restored, with a title and a cover

At the owner's direction, the first chapter is back to the preview before the rebuild (1d4dd1f): the threads, the 2000s and 2020s, the memory row (device left under "This is mine", the father's words right), and the pinned wooden set with its hands and game, ending in the phone under the chart. Kept from the rebuild: today's time chart inside that scene, and the device's glimpse at the opening's right, from where it now crosses to its place and folds shut once read. New: the title "Chess, again?" with the cover picture as the first screen; the opening's original wording, its second line smaller.

Checked on the local site with headless Chromium: `chess-story/checks/again.cjs` (screenshots through the opening, memory, years and the wooden pin at 1440×900, 1024×768 and 375×812; no page errors, no sideways overflow) and `cross.cjs` (no thread through any words at 16 sizes, 320 to 1920 wide). Typecheck and production build passed.

## 22 November — first screen in two columns, a steady device, large years

Title and a placeholder short text (`intro`) at the left, the cover smaller at the right. The device is now held by `position: sticky` with its moves as CSS transitions, instead of a transform written on every scroll frame: `chess-story/checks/device-steady.cjs` scrolls by mouse wheel and finds its screen position identical in every frame while held (153 px over 840 px of scroll), then one quick crossing. "Years went by. / No chess." at up to 112 px, threads re-routed; `cross.cjs` clean at 16 sizes plus 375 and 414 wide.

## 22 November — threads out of the cover, the device peeks, the years apart

Threads begin inside the cover's lower edge; grey threads at 0.68 opacity. Cover column 3/5 of the width. The device peeks at the right while the question is read and glides to its place (a transition, in the page's flow) as the reader scrolls on, the memory's words appearing with it. "No chess." is its own step, placed at the lower right. `cross.cjs` clean at all 16 sizes; typecheck and production build passed.

## 22 November — Part I polished: clay means chess, the reader's thread, en passant, true seeds

Owner-approved changes from the Part I brainstorm (see DESIGN.md): colour stops on the story's thread (clay / grey), calmer thread family from the cover with tips visible at load, the reader's optional thread (`you`, `you-back`), en passant played on the device with its LCD, the fold timed to "Years went by.", phone rise, the claim beside the chart, 1. e4 marks (checked against the author's games: London Feb–Mar 2026, 1. e4 only since April), the table's wording, type roles and one motion style, decades at the right, a faster wooden game (pin 7.3 instead of 8.45 screens), a bigger cover. The 1000-rating goal stays out.

Checked: `chess-story/checks/part1-play.cjs` (reader's thread turns ivory and aria-pressed; en passant ends on E.P. with "Again"; 1440 and 375 wide, no errors), `again.cjs` screenshots through Part I at 1440×900 and 375×812, `cross.cjs` no thread through any words at 16 sizes. Typecheck and production build passed.
