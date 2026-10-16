# Elections in Belarus — the ballot's images

The four engravings in `public/images/stories/belarus/` are the author's own cut-outs.
They were made with the Lithuania script (`../lithuania/make-images.cjs`), which trims the
transparent edge and saves a WebP with alpha, 240px tall:

    node ../lithuania/make-images.cjs <repo>/node_modules/sharp <repo>/public/images/stories/belarus \
      "tikhanouski|input.png|tall" "babaryka|input.png|tall" "tsepkalo|input.png|tall" "tikhanovskaya|input.png|tall"
