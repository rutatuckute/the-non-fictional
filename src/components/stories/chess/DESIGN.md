# Chess story — editorial direction

A personal data story in the site's dark editorial palette: Newsreader, muted ivory, the clay red narrative thread, and data green for later investigation charts and navigation. Preserve real source data, anonymous comparisons, responsive reading order and chapter navigation. No decorative cards or new app chrome.

## The thread (restored 22 November, owner's direction)

The first screen: the title "Chess, again?" (display size) with a short text under it (step `intro`, a placeholder) at the left, the cover, large, at the right (columns 3 : 7). The threads' tips already show under the cover at load (`data-thread-floor`), so the eye follows them down. Date and reading time live with the method at the end.

**Clay means chess is present.** The story's thread `a` leaves from the author's sleeve in the cover, grey; it runs with the others down the right of the opening, takes its colour as it goes in behind the device in its place ("This is mine."), goes grey again through the years with no chess, and is clay again at the wooden set; from there it is the chart's line. Colour stops are knots marked "clay" / "grey" (thread.js builds one vertical gradient from them). Part I's threads are one calm family (less wander: 4.5 for the others, 2.5 for the story's), leaving in their own time.

**The reader's thread.** Under the opening question: "Hold on to it for a moment." and a quiet button, "I have one". Pressed, the grey thread `you` turns ivory; it runs through Part I, leaves by the edge at the set, and comes back in Part IV (`you-back`) beside the story's thread, where "Is yours still there?" stands under the last question. React state only, nothing stored.

**The device.** It peeks at the right of the question on desktop; on phones it waits low and rises as the question leaves; it glides home as the memory's words come in, and folds shut on its outer cover when "Years went by." reaches the middle of the screen. Its LCD shows E2 E4. "Show me on the board" under the en passant line plays 2. f4 exf4 3. g4 fxg3 e.p. on the device's own board, with pawns and squares cut from the picture, the LCD showing each move and then E.P.; reduced motion shows the end at once (origin.js).

**Seeds of Part III, all true.** The first move: E2 E4 on the device, 1. e4 marked under the wooden set as it is played and under the phone's first game (the author opened 1. e4 before the London System of Feb–Mar 2026 and only 1. e4 since). The first online game ended with the opponent resigning after one move each. "I'm not THE chess player, though…" stands beside the chart as it arrives, with the note at its peak (about 100 minutes a day).

**Type roles in Part I** (tokens on `.ch-story`): display `--t-display` (title, years), statement `--t-statement` (question, "This is mine."), second voice `--t-second` (the line under the question, the father's words), narrative (`lead`), quiet note. **Motion:** one easing `--ch-ease`, `--ch-move` 750 ms, `--ch-fade` 650 ms; the set turns in 900 ms, the device folds in 850 ms. Decades stand at the column's right edge, quiet.

"Years went by." stands at the upper left, "No chess." (step `years-none`) at the lower right, display size; the threads weave between them. The wooden game keeps all six moves and three opponents' hands but moves faster (a move every 0.3 screens), about a fifth shorter.

The time chart is the colour exception: red follows the narrative thread. It shows recorded elapsed live-game minutes (PGN UTC start/end), including zero-play days, Gaussian smoothed with σ=10 days across 81 days (±40, edge-renormalised). Every exported point, including the 102.8-minute March 2026 peak, is retained. The caption names the smoothing and excludes puzzles, analysis and time between games.

## What we say about ourselves

Readers first see the author's own claim, then investigate it. The message lifts out of the phone. The first chart stays narrow: the author's rapid and bullet daily rating lines, one approximate May claim date, and a scroll reveal. A native range supports pointer, touch and keyboard. Early bullet calibration is not declining skill.

“Lower than whom?” widens the same stage into a population scatterplot. The green bullet point becomes the author among 1,388 sampled players; the median line arrives after the cloud. Daily last ratings change to July–September medians explicitly in captions. Do not claim equivalence between rating pools. Responsive charts scale to their available width, with captions and keyboard-accessible methodology. Reverse scroll and chapter jumps restore the right state; reduced motion updates immediately.

Four username blocks pair editable lower / same / higher predictions with B2 fractional pawn reveals. A sticky right chart shows answered groups on desktop; compact screens show each result in its block. Neutral five-in-ten baselines, immediate feedback, transient React state. Anonymous values come from say.json and ratings.json; no storage changes.

## People and later scenes

The four invented phone opponents retain distinct illustrative legal positions and clock pairs, never claimed as records of their games. The professor's bubble sits left and centres its text. Other chart highlights use data green. Preserve the club sequence, the enlarged investigation message, ratings and username interactions during opening revisions.
