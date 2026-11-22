# Chess story — editorial direction

A personal data story in the site's dark editorial palette: Newsreader, muted ivory, the clay red narrative thread, and data green for later investigation charts and navigation. Preserve real source data, anonymous comparisons, responsive reading order and chapter navigation. No decorative cards or new app chrome.

## The thread (restored 22 November, owner's direction)

The first screen: the title "Chess, again?" with a short text under it (step `intro`, a placeholder for now) at the left, the cover picture, smaller, at the right; on phones stacked. The card and share cover is `/images/uploads/chess-again-cover.jpg`, set by `cover:` in the draft. Then the opening question on its own screen, its second line ("Nothing major…") a little smaller (step `opening-aside`). Date and reading time live with the method at the end.

The Pocket Micro is glimpsed at the opening's right on desktop. It is held on screen by `position: sticky` in a track running from the opening down to its place in the memory, never moved frame by frame against the scroll (that shook). It slides in from the edge, and as its place arrives it crosses to the left in one 650 ms transition and lands under "This is mine", with the father's words on the right; those words fade in as it lands. Once read, its left half folds shut on the outer cover (900 ms). On phones it stands in its place; reduced motion: every change at once (origin.js).

"Years went by. / No chess." is the chapter's largest type, at the left; the threads keep to its right, on phones to the margins.

Threads (`LINES`), the large quiet 2000s over the memory and 2020s by the years, and the pinned wooden set are as in the preview before the rebuild (1d4dd1f): the set turns over, the pieces are set up, six plies are carried by the author's hand and three different opponents' hands, then the board becomes the phone's and the phone rests under the time chart's corner, the red thread running into it. The chart there is the 22 November one (no social-media line, no question marks; whole line at once, the peak note fading in). Part II is again its own pinned scene with its title held at the top.

The time chart is the colour exception: red follows the narrative thread. It shows recorded elapsed live-game minutes (PGN UTC start/end), including zero-play days, Gaussian smoothed with σ=10 days across 81 days (±40, edge-renormalised). Every exported point, including the 102.8-minute March 2026 peak, is retained. The caption names the smoothing and excludes puzzles, analysis and time between games.

## What we say about ourselves

Readers first see the author's own claim, then investigate it. The message lifts out of the phone. The first chart stays narrow: the author's rapid and bullet daily rating lines, one approximate May claim date, and a scroll reveal. A native range supports pointer, touch and keyboard. Early bullet calibration is not declining skill.

“Lower than whom?” widens the same stage into a population scatterplot. The green bullet point becomes the author among 1,388 sampled players; the median line arrives after the cloud. Daily last ratings change to July–September medians explicitly in captions. Do not claim equivalence between rating pools. Responsive charts scale to their available width, with captions and keyboard-accessible methodology. Reverse scroll and chapter jumps restore the right state; reduced motion updates immediately.

Four username blocks pair editable lower / same / higher predictions with B2 fractional pawn reveals. A sticky right chart shows answered groups on desktop; compact screens show each result in its block. Neutral five-in-ten baselines, immediate feedback, transient React state. Anonymous values come from say.json and ratings.json; no storage changes.

## People and later scenes

The four invented phone opponents retain distinct illustrative legal positions and clock pairs, never claimed as records of their games. The professor's bubble sits left and centres its text. Other chart highlights use data green. Preserve the club sequence, the enlarged investigation message, ratings and username interactions during opening revisions.
