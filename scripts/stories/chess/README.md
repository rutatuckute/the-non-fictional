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
| I | `memory`, `years`, `not-a-player`, `board`, `obsession`, `obsession-time`, `obsession-questions` |
| II | `strangers`, `strangers-many`, `professor`, `professor-remark`, `professor-quote`, `boards`, `question`, `question-large` |
| III | `data-intro` |
| III, first question | `say-message`, `say-prediction`, `say-guess`, `say-answer`, `say-limits` |
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
      "device|input.png|800,480" "wooden-set|input.png|1000,600|64"

- `device`: the Chess King Pocket Micro of the opening memory, supplied by the
  author.
- `wooden-set`: the wooden travel set of the 2020s, open, supplied by the
  author. Made at `1000,600|64`.

## State of the build

This is the skeleton. The scroll, the pinned scenes, the reader's guesses and
the thread work; every picture and chart is still a box that names what will
stand there. The data and the scripts that make it will be described here as
each part is built.
