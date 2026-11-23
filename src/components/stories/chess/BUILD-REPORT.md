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

## 22 November — sizes, the wooden set's order, the estimate back

Owner's list: smaller second line and "Hold on…"; the years in the title's exact type; the set's sequence (text, turn, pieces at once, hands, "Different people…", then the last two lines); Chess.com in the data green; chart title clear of the thread (thread bends above it; chart 22 px in, clear of the tick labels); line breaks in the claim, trade-off and questions; "And thus, more questions."; the dashed social media estimate back with "A winning trade-off?". Checked with `again.cjs` (1440×900, 375×812), `cross.cjs` (16 sizes, clean after scaling the display size on small phones), computed font sizes (title = years: 89 px desktop, 51 px at 375).

## 22 November — Part II rebuilt: one phone, crossing lives, the turn given room

The phone under the chart grows back and searches, then three strangers (one per question) with self-drawing, "imagined" vignettes and grey threads crossing the game; 1,938 threads for the people met; the club with the London System's squares in clay, the professor's question, "How did he know?", the two readings and the central question each alone and quiet; the thousand boards answer the pointer. Chess.com's own pieces on the phone. Words scroll beside the picture on wide screens, stand at the top on phones.

Checked: `chess-story/checks/part2-play.cjs` (search, then the first stranger at the chapter mark; a board's note on hover and on tap; 1440 and 375, no errors or failed requests), `nav.cjs` (all jumps and keyboard at 1440, 1024, 390; its "the thread" and "the people" expectations updated to the title screen and the new Part II), `cross.cjs` (16 sizes clean; Part II's floating title excluded, as it is shown only over the scenes' own ground), `part1-play.cjs`, screenshots through the part at 1440×900 and 375×812. Part II is 10.7 screens from its title to Part III (before: about 9.9). Typecheck and production build passed.

## 22 November — Part III: the rabbit hole, investigation 1 polished, investigation 2 built

Owner's answers: colour language yes (clay = author, grey/ivory = others, light = reader, green only navigation); rabbit-hole hand-off and sticky Part III title yes; no cards, username game one group at a time; the rush-after-a-loss finding left out for now; 18 May and no blitz caveat. Investigation 2 built with game A (22 Sep 2026) and the three-queens stalemate (my recommendation; the owner asked for the differences, given in chat). Investigation 3 to be discussed after this.

Data: `chess-story/analysis/export_wrong.py` (data-stories repository) writes wrong.json: rating bands from the saved resign exploration (no new engine run), the author's rapid queen-down games (queen gone and still 6+ down two half-moves after the capture, so trades don't count), the decision game's positions, the resigned opponent, the stalemate. Candidate positions were scored once with Stockfish depth 12 (A −8.2, B −8.1, C −9.8, D −1.9, E −0.3).

Checked: `checks/part3-play.cjs` (bullet guess and answer, four username guesses and score, resign choice shown on the phone, rating bands switch; 1440 and 375, no errors), `nav.cjs` (Part III expectations updated: the three boards; scenes without cards), `cross.cjs` 16 sizes, `part1-play.cjs`, `part2-play.cjs`, screenshots of every Part III step at 1440×900 and 375×812. Fixed on the way: a crash of the play-out after a long jump (position index guarded), and hidden phone words catching taps. Part III: hand-off 2.4 screens, investigation 1 7.6, investigation 2 4.8 (desktop). Typecheck and production build passed.

## 23 November — investigation 3: the style scales

Owner's direction: three scales (aggressive, cautious, impulsive) against players of her rating; definitions written and approved before running (`chess-story/analysis/style-definitions.md`, one logged sampling change: at most 60 games per peer); her own Stockfish labels from the *Chess, again?* app read, read-only, through the gateway bridge, with her go-ahead; no "difficult positions" engine run. Results in `style-results.md`. The club visit was before 23 March (owner), which makes the verdict "He was right. Just not yet."

Built: reveal.js (the switch barcode, the reader's guesses on three scales, each revealed with two rows, notes, verdict) and style.json (`export_style.py`). Checked: `part3-play.cjs` (three sliders, the reveal reports the reader's placement, three guess marks; 1440 and 375, no errors), `nav.cjs`, `cross.cjs` 16 sizes, `part1-play.cjs`, `part2-play.cjs`; screenshots of every step at 1440×900 and 375×812. Typecheck and production build passed.

## 23 November — Part IV: the message, and the question handed back

The chat screenshot (private, data-stories repository) lit only where his question, its hour and her answer are (`make-hinge.cjs`, from the earlier reveal mock), on the story's phone, shown close with the top fading. Part title "Back to the threads of life"; the encounter, the continuing game and the closing question drafted from the owner's arc. Checked: screenshots at 1440×900 and 375×812, `cross.cjs` 16 sizes, `nav.cjs`. Typecheck and production build passed.

## 23 November — the chats as the page's own text; method notes

Owner's changes: no hour on either phone (18 May 2026 only); Part IV's messages no longer recognisable as any app — written as HTML on the blank phone, hers in clay, his in a quiet grey (the screenshot-derived image and its script removed); "What we cannot know" removed; short method notes written. Checked: screenshots at 1440×900 and 375×812, `cross.cjs` 16 sizes, `nav.cjs`. Typecheck and production build passed.

## 23 November — reader thread, copy, pawn colours and continuous rabbit-hole zoom

Selected reader thread (including its return at the end): data green, full opacity, 2px stroke, with a matching selected control. Removed the no-conversation passage, “This is how I picture them” and the visible “imagined” captions. The rabbit-hole transition now extends the original club stage: the same grid and board zoom in together, then the three investigation links appear. Removed both duplicate transition images. Hidden links are inert; reduced motion switches scenes without scaling.

Username results and selected guess/rating controls use data green. Queen-loss outcomes have four matching pawn/legend colours: lavender resigned, amber left, blue played on and lost, green saved. The author's saved games also use green.

Verified on the local Next preview at port 3200 using Playwright Chromium: `checks/story-revisions.cjs` in the data-stories project passed at 320, 360, 375, 390, 600, 768, 820, 1024 and 1440px. Checks cover copy removal, selected thread colour, one original grid retained across forward/reverse zoom, chapter landing and links, keyboard selections, coloured result pawns versus grey baseline, matching outcome legends, rating changes, reduced motion and no horizontal overflow or page errors. `checks/nav.cjs` passed all chapter jumps and keyboard/menu interactions at 1440×900 and 390×844. Screenshots inspected at 375×812 and 1440×900, including intermediate zoom frames and both pawn charts; artifacts in `/tmp/chess-story-revisions/` (and `/tmp/chess-1440-*.png`). `npm run typecheck`, `npm run build` and `git diff --check` passed. Matrix shared-browser actions were unavailable; visual verification used the standalone local browser. No persistence flow changed.

Guidance loaded: matrix-app-builder, matrix-design-system, matrix-app-ui-patterns, emil-design-eng and animate; preserved this existing Next.js site's runtime and editorial identity.
