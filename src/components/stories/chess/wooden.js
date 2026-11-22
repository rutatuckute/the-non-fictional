"use client"

import { c, Picture, Text } from "./parts"
import { Knots } from "./thread"

// The image stays, the two paragraphs each keep their own place in the page.
// On a phone the same set is a static image above both passages.
export const Wooden = ({ lines }) => (
  <section className={c("ch-woodenReading")} aria-label="The little wooden chess set">
    <Picture
      className={c("ch-woodenStill")}
      name="wooden-set"
      alt="A little wooden travel chess set lying open, with its dark and light pieces resting in green felt."
      width={838} height={1000} small={500}
      sizes="(max-width: 60rem) 85vw, 450px"
    />
    <div className={c("ch-woodenPassages")}>
      <Text name="board" look="lead" />
      <Text name="not-a-player" look="lead" />
    </div>
    <Knots of={lines} />
  </section>
)
