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
- `club.js`: the club's board in Part II, and the London System set up on it.
- `follow.js`: how a scroll-led scene follows the scroll in a glide.
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
| I | `mine`, `memory`, `not-a-player`, `not-defining`, `board`, `possibilities`, `first-game`, `obsession`, `obsession-questions` |
| II | `people-title` (a heading), `people-intro`, `strangers`, `club`, `professor`, `professor-quote`, `professor-how`, `boards`, `data` |
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

- `piece-wk` … `piece-bp`: the wooden set's twelve pieces, cut from one sheet
  the author made with a GPT image model (6 columns by 2 rows of 500 x 600 px
  cells, light above dark, king, queen, rook, bishop, knight, pawn; the prompt
  is W1 in the data-stories repository's `chess-story/visuals/PROMPTS.md`).
  `make-pieces.cjs` cuts each to its solid part, saves them at one scale and
  writes their sizes to `src/components/stories/chess/pieces.json`:

      node make-pieces.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess <repo>/src/components/stories/chess/pieces.json piece "sheet.png|0|w" "sheet.png|1|b"

- `hand-me`: the author's hand, seen from above, the arm coming from below:
  the hand that moves White's pieces, on the wooden board and at the club. Engraved and printed
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

- `club-board-empty`: the board at the London chess club, pink and white, with
  nothing on it. The author supplied the board with its plastic pieces set up;
  the empty one is that picture with the pieces taken off by a GPT image model
  (prompt B1). `make-club-board.cjs` cuts it to the box that holds both
  pictures, so it sits where the original did, writes it at 1000 and 600 px
  wide, and prints the squares' edges, which are `BOARD` in `club.js`:

      node make-club-board.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess empty.png original.png

- `club-wk` … `club-bp`: the club's pieces. The original picture has a strong
  perspective: its far pieces are seen almost from the side, its near ones from
  well above. So the two colours are two drawings, each as its side of the
  board shows it: Black from the lower row of a first sheet (prompt B2), White
  from a sheet of its own (prompt B2-white). Sizes in `club-pieces.json`:

      node make-pieces.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess <repo>/src/components/stories/chess/club-pieces.json club "white.png|0|w" "first-sheet.png|1|b"

- `professor`: the professor at the London chess club, the club scene's one
  figure: a half figure seen from behind, standing at the board's left and
  bowed over it. Engraved in the manner of every.to's figures and made with a
  GPT image model to the prompts in the data-stories repository
  (`chess-story/visuals/PROMPTS.md`, "PRINTED PEOPLE"). Printed for the page by
  `make-print.cjs` in two inks, the page's dark and the site's ivory, in its
  crisp setting so the engraved lines survive. He stands in front of the
  board, so his dark ink is printed in the page's own dark (`FILL=1`) and hides
  what is behind him instead of letting it show through:

      FILL=1 PRINT=0,140,40,1.1 node make-print.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess "professor|input.png|520,300"

- `opponent-arm`: the opponent at the club, shown only as an arm reaching in
  from the far side of the board. Made and printed like the figure (`FILL=1`,
  widths `640,360`), with the gap between its fingers and thumb named so that
  it is cleared and the board shows through it (a point inside the gap, in the
  original's pixels, after the widths):

      FILL=1 PRINT=0,140,40,1.1 node make-print.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess "opponent-arm|input.png|640,360|372,759"

  `club.js` turns it about its fingertips, fades its far end, and has it carry
  Black's pieces.

- `phone` and `phone-game`: the phone of the story, a Google Pixel in a rugged
  black case seen from the front (a render made with a GPT image model, prompt
  O5, its screen switched off), with a real screenshot of the author's first
  Chess.com game laid on its screen (29 April 2023, over after 1.e4 Nf6).
  `make-phone.cjs` blurs both players' usernames and profile pictures past
  reading, the author's own included, and takes out the phone's status bar
  (its header says how, and what else it adjusts). `phone` is that screen as
  it was. `phone-game` (made with `new-game`) is the same screen before any
  game: the board put back to the starting position from the screenshot's own
  squares, and the move list, the opponent's bar and both clocks' digits
  emptied, for the page to write in (Part II's strangers). `make-images.cjs`
  then makes the page's sizes. The screenshot as supplied is kept out of the
  repository.

      node make-phone.cjs <repo>/node_modules/sharp phone.png screenshot.jpg phone-first-game.png
      node make-phone.cjs <repo>/node_modules/sharp phone.png screenshot.jpg phone-new-game.png new-game
      node make-images.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess "phone|phone-first-game.png|800,480|82" "phone-game|phone-new-game.png|800,480|82"

- `stranger-1` to `stranger-4`: a glimpse of each
  of Part II's strangers, beside the phone: hands, a phone, one thing of where
  they are, never a face. Engraved and printed like the professor (`FILL=1`,
  widths `520,300`). The first is a close-up cut from a larger drawing (700 px
  square from left 10, top 740 of the original); the page fades it out all
  round, about the point named as the stranger's `focus`. The second is drawn
  as a close-up, with the gap between his arms and the pole named so that it
  is cleared (`"stranger-2|input.png|520,300|500,560"`). Prompts: "The
  strangers" in the data-stories `PROMPTS.md`.
- `boards`: "the board of a thousand games": how the author's last 998 games
  ended, each a tiny board, in a grid of 37 by 27 whose middle place is left
  for the club's board. Her pieces are dots of the story's clay, her
  opponents' ivory. `make-boards.cjs` draws it from final positions exported
  in the data-stories repository (`chess-story/analysis/export_boards.py`:
  the positions and the colour she played, nothing else):

      node make-boards.cjs <repo>/node_modules/sharp <repo>/public/images/stories/chess boards.json

## The wooden set, pinned, and what it becomes

`wooden.js` holds one scene on screen for several screens of scrolling, and it
carries Part I from the wooden set to the chart:

1. The set comes in open, turns over to the board about its hinge, the pieces
   are set up, and a short game is played (`PLIES`), each move carried by a
   hand.
2. The pieces are put away and the board becomes the board on a phone's
   screen: the phone (`phone`) is laid over the set with its squares on the
   set's squares (`PHONE`), and the two draw back together, the set giving way,
   until the whole phone is in view (`HELD`).
3. The phone goes small and to the corner (`REST`). The chart's stretch begins
   a little under half a screen before the scene's ends, so the chart comes up
   under the phone, and the thread, which went in behind the phone, comes out
   below it and into the chart as the line of data.

Nothing waits for a text: the scroll alone leads it, forwards and back. Beside
the set, four sentences change with the scroll while it stays (`SAID`:
`not-a-player`, `not-defining`, `board`, `possibilities`; when each takes over
is in `SAID_AT`); then `first-game` stands beside the phone, and `obsession`
beside it at rest.

- The scene follows the scroll, it does not sit on it (`follow.js`): in every
  frame it closes a share of the distance to where the reader has scrolled, so
  a mouse wheel's steps and an uneven swipe are drawn as one glide. Pieces,
  hands, the set and the phone are moved by transforms written straight onto
  them, frame by frame; only what changes in steps is state.
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

On a phone the words stand above the board, and the last sentence goes when
the first move is answered, for the hands that answer come in there.

The threads' stretch here is several screens long and passes behind the stage,
so `LINES.wooden` keeps each thread to a lane: the story's thread behind the
board (on a phone, at the left, clear of the words above it), the others off
the screen's edge. `LINES.woodenAfter` are the knots of the scene's last
screen, where the phone rests: its middle is `PHONE_X`, which has to follow
`REST` if that changes.

## Part II: the people behind the game

Part II opens with its name (`people-title`, a heading in the body) and a few
words, and then is one pinned scene (`People` in `scenes.js`). What the scene
shows at each step is in `VIEWS`:

1. `strangers`: the phone again, before a game (`phone-game`). The opponent
   changes as the reader scrolls, on the phone's screen and, large enough to
   read, beside it: a username, a rating, a country (`STRANGERS`). The four are
   invented, and were checked not to be anyone's username. Each has a small
   picture, `figure`.
2. `club`: the phone goes and the club's board comes up out of its board;
   "London, early 2026" stands beside it, and the opening is played (below).
3. `professor`: he leans in, at the board's left.
4. No card: his question (`professor-quote`) stands across the top of the scene.
5. No card: `professor-how`, alone, the club far back behind it.
6. `boards`, `data`: the board goes small, into the middle of the thousand
   (`boards`, a picture four of the scene's squares wide).

A step can be more than a card (`Pinned` in `parts.js`): `{ card, rest }` gives
it more scrolling than a card's passing, `{ bare: true }` is a stretch with no
card. `useSince` counts the parts of a step's scrolling, for the strangers.

### The club's board, and the London System

`club.js` draws the board of the club and plays a game on it: 1.d4 d5 2.Bf4 Nf6
3.e3 e6 4.Nf3 c5 5.c3, the London System set up (`PLIES`). It is led by the
scroll like the wooden set and follows it the same way (`follow.js`), but it
stands inside a pinned scene of cards: its clock is how far the reader has
scrolled since the `club` card reached its line, and that step is given
`CLUB_REST` more screens of scrolling, with no card in them, for the moves to
be played.

The board is in perspective, so every rank has its own files' edges and its
own scale (`BOARD`), and a piece grows as it comes nearer. The players are
their hands and nothing more: White's moves are carried by the author's hand
(`hand-me`, the wooden board's), coming in from the near side, Black's by the
opponent's arm from the far side.

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

Parts I and II are built, with their pictures; the texts placed in them are
the author's first drafts, and one is still a note in brackets (`first-game`). Part III's first question is
built from data; its other two, and Part IV, are still boxes that name what
will stand there.
