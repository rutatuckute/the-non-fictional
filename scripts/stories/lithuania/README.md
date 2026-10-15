# Lithuania timeline — images

The engravings in `public/images/stories/lithuania/` are the author's own cut-outs,
trimmed of their transparent edge and saved as WebP with alpha by `make-images.cjs`:
portraits and emblems 240px tall, the two wide groups (the Council of 1918, the
Baltic Way) 480px wide. Mindaugas is cropped to the crown and head; the Baltic Way
to its top 78% (the flag and the raised hands).

    node make-images.cjs <repo>/node_modules/sharp <repo>/public/images/stories/lithuania \
      "name|input.png|tall|wide[|head|top78]" …

The two wide ones carry their height/width ratio in `LithuaniaTimeline.js`
(`ratio`), which the card layout uses to stack cards by their real height.
