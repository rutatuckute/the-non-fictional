# The chess story

The chess story is the whole piece, not a figure inside one. Its article's body
is a single story marker, and the article page hands it the page from the
masthead down (`PAGE_STORIES` in `src/lib/stories.ts`). The masthead, the
Library, the neighbouring pieces and the footer stay the site's.

The code is in `src/components/stories/chess/`:

- `ChessStory.js`: the page, top to bottom. The opening, the free-scroll parts,
  and the order of everything.
- `scenes.js`: the pinned scenes, where a graphic stays on screen while short
  texts pass it.
- `thread.js`: the thread, one line drawn through the story as far as the reader
  has scrolled. It passes through `Knot`s placed in the layout.
- `wooden.js`: the wooden set of the 2020s, pinned, and the game played on it.
- `parts.js`: what the others are built from.

## The words

Every word comes from the article's body. Until the piece is published that
body is the file `drafts/chess-story.md`, shown in development and on preview
deployments only (`src/lib/drafts.ts`); at launch it moves into the panel. Each
text is a named step, and the code places it by name, so texts can be written
in any order:

    <!--story:chess-->

    <!--step:opening-->
    The opening question.

    <!--step:memory-->
    The first memory.

    <!--/story-->

A name the body doesn't have shows a dashed note in development and nothing on
the published site. The names, in reading order:

| Part | Names |
| --- | --- |
| Opening | `opening` |
| I | `mine`, `memory`, `not-a-player`, `not-defining`, `board`, `obsession`, `obsession-time`, `obsession-questions` |
| II | `strangers`, `strangers-many`, `professor`, `professor-remark`, `professor-quote`, `boards`, `question`, `question-large` |
| III | `data-intro` |
| III, first question | `say-message`, `say-prediction`, `say-guess`, `say-answer`, `say-surprise`, `say-limits` |
| III, second question | `wrong-observation`, `wrong-decide`, `wrong-outcome`, `wrong-crowd`, `wrong-you` |
| III, third question | `reveal-professor`, `reveal-games`, `reveal-style` |
| III, the end of it | `unknown`, `unknown-showed`, `unknown-cannot` |
| IV | `encounter`, `continuing`, `last-question` |
| After the story | `method` |

## The pictures

The story's pictures are cut-outs in `public/images/stories/chess/`, trimmed of
their transparent edge and saved as WebP with alpha by `make-images.cjs`, each
in a large and a phone width:

    node make-images.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess \
      "device|input.png|800,480" "wooden-set|input.png|1000,600|64" "wooden-board|input.png|800,480|64"

- `device`: the Chess King Pocket Micro of the opening memory, supplied by the
  author.
- `wooden-set` and `wooden-board`: the two sides of the wooden travel set of
  the 2020s, open (the pieces in green felt) and turned over (the board),
  supplied by the author with the hinge upright. `make-set-pair.cjs` puts both
  on one canvas at one scale and lays them as the set lies between two
  players, the hinge across: the inside turned a quarter (the light pieces
  nearest), the outside turned and mirrored, so that its corners stay a
  chessboard's (a dark square at the near left). 838 and 500 px wide:

      node make-set-pair.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess inside.png outside.png

- `piece-wk` … `piece-bp`: the set's twelve pieces, cut from one sheet the
  author made with a GPT image model (6 columns by 2 rows, light above dark,
  king, queen, rook, bishop, knight, pawn; the prompt is W1 in the
  data-stories repository's `chess-story/visuals/PROMPTS.md`). `make-pieces.cjs`
  cuts each to its solid part, saves them at one scale and writes their sizes
  to `src/components/stories/chess/pieces.json`:

      node make-pieces.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess sheet.png <repo>/src/components/stories/chess/pieces.json

- `hand-me`: the author's hand, seen from above, the arm coming from below:
  the hand that moves White's pieces on the wooden board. Engraved and printed
  like the people of the club scene (`FILL=1`, widths `440,260`), from the
  original with 12 px cut off its left and right edges, where a faint column
  of specks would otherwise print.
- `hand-opponent-1`: the first hand that answers on the wooden board, a man's,
  with a rolled-up sleeve and a wristwatch, the arm coming from above. Made
  and printed exactly like `hand-me`.
- `hand-opponent-2`: the second, an older man's: a tweed sleeve, a buttoned
  shirt cuff, a plain ring. Made and printed the same way.
- `hand-opponent-3`: the third, a young man's, half hidden in the sleeve of a
  hooded sweatshirt. Made and printed the same way, at widths `500,300`.

- `club-board`: the board at the London chess club, pink and white with its
  plastic pieces set up, supplied by the author. Its faint specks (alpha under
  48) are dropped and it is trimmed; made at 1000 and 600 px wide.
- `professor` and `me-club`: the two people of the club scene, half figures
  seen from behind: the professor standing at the board's left, bowed over it,
  and the author in the foreground. Engraved in the manner of every.to's
  figures and made with a GPT image model to the prompts in the data-stories
  repository (`chess-story/visuals/PROMPTS.md`, "PRINTED PEOPLE"). Printed for
  the page by `make-print.cjs` in two inks, the page's dark and the site's
  ivory, in its crisp setting so the engraved lines survive. Both stand in
  front of the board, so their dark ink is printed in the page's own dark
  (`FILL=1`) and hides what is behind them instead of letting it show through:

      FILL=1 PRINT=0,140,40,1.1 node make-print.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess "professor|input.png|520,300" "me-club|input.png|560,320"

- `opponent-arm`: the opponent at the club, shown only as an arm reaching in
  from the far side of the board, its fingers closing on the knight on g8.
  Made and printed like the two figures (`FILL=1`, widths `640,360`); the
  page turns it about its fingertips and fades its far end.

- `phone`: a phone with a Chess.com game about to begin, supplied by the
  author. Made at `800,480` from a copy in which the opponent's username and
  profile picture are hidden; the copy as supplied is kept out of the
  repository.

## The wooden set, pinned

`wooden.js` holds the wooden set on screen for a few screens of scrolling. It
comes in open, turns over to the board about its hinge, the pieces are set up,
and a short game is played (`PLIES`), each move carried by a hand. Nothing
waits for a text: the scroll alone leads it, forwards and back.

- The scene follows the scroll, it does not sit on it: in every frame it
  closes a share of the distance to where the reader has scrolled (`FOLLOW`),
  so a mouse wheel's steps and an uneven swipe are drawn as one glide. Pieces
  and hands are moved by transforms written straight onto them, frame by
  frame; only what changes in steps (turned, set up, moves played) is state.
- A move takes `LASTS` screens of scrolling and the next begins `EVERY` after
  it, so one hand is still leaving as the other comes in. Each stretch of a
  move (the hand comes, carries, leaves) starts and ends at rest. A hand is
  whole while any of it is over the board and fades only beyond its edge.
- The squares' edges in the board's picture are in `BOARD`; a piece is placed
  by its square, sized from `pieces.json`, and stands on its base.
- The author's hand comes from below. The hands that answer from above, one
  person's after another's, are in `THEIRS`, in the order of Black's moves; a
  move whose hand is not made yet is played with no hand. A hand's `grip` is
  where its fingers close, as shares of its picture: the piece's head is put
  there. To give a new hand the others' scale: `wide = 0.32 x (width of its
  ink in the original) / 421`.
- With motion turned off each move is made in one step, with no hand, and the
  scene sits on the scroll.

On a phone the words above the board go when the game begins, for the hands
need the room.

The threads' stretch here is several screens long and passes behind the stage,
so `LINES.wooden` keeps each thread to a lane: the story's thread behind the
board, the others off the screen's edge from the first screen to the last.

## The data

- `src/components/stories/chess/time.json`: the line the thread follows where
  Chess.com arrives. Minutes a day the author spent in live games (rapid,
  blitz, bullet), smoothed: each day a weighted average of the days around it,
  the weights a bell curve with a ten-day spread (fewer days at the two ends).
  Every seventh day is kept, with the first, the last and the highest. A
  game's length is the time between its recorded start and end, from
  Chess.com's public data for the account; days are UTC days. It is time in
  games, not on the site: puzzles, lessons, analysis, daily games and the
  minutes between games are not in it.

  It is made in the data-stories repository, in `chess-story/analysis/`:
  `refresh_personal.py` (bring the games up to date), `time_per_day.py` (the
  table, day by day), `export_time_line.py` (this file).

- `src/components/stories/chess/social.json`: time on social media. **Not
  data**: a handful of guessed points, marked `"estimate": true`, until there
  is usage data to replace them. The chart draws it dashed, smooth and without
  wiggles, and calls it estimated in its legend and in its description.

  `time-chart.js` draws the two: `Trace` in `thread.js` carries the thread
  through every point of `time.json` as given, and the estimate draws in step
  with it. The axes are minutes up the side (in hours) and years along the
  bottom, with a legend; the figure's accessible name says in words what both
  lines show and that one is an estimate.

Where the data ends, the thread stops being a line and goes on as a trail of
question marks (`Trace … then="questions"`, `questions()` in `thread.js`):
sparse at first, then closer, larger and further from the way, some in pairs,
each appearing as the reader reaches it, down to the edge of Part II. The
trail is seeded, so it is the same on every visit, and every mark stays inside
the screen.

- `src/components/stories/chess/say.json`: the numbers of the first question,
  made by `chess-story/analysis/export_say.py` (from `names_vs_rating.py`).
  The author's bullet rating against her rapid, July to September 2026, and the
  same gap for the 242 sampled players at her rapid level (gaps only, rounded,
  shuffled). Then usernames sorted by what they say about their owner's chess,
  against the ratings of the opponents you meet: each opponent counted once per
  game against the sample, at the rating shown beside their name then. The
  examples are patterns, never anyone's username.

## State of the build

This is the skeleton. The scroll, the pinned scenes, the reader's guesses and
the thread work; every picture and chart is still a box that names what will
stand there. The data and the scripts that make it will be described here as
each part is built.
