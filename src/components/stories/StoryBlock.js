"use client"

import dynamic from "next/dynamic"

import styles from "../../styles/blog-post.module.css"

// Every story and figure, by the name the body gives it. Each is loaded only
// on the piece that uses it, so the other articles carry none of their code.
const STORIES = {
  "take-me-home-prices": dynamic(() => import("./take-me-home/PriceStory")),
  "sarajevo-walk": dynamic(() => import("./sarajevo/SarajevoWalk")),
  "lithuania-timeline": dynamic(() => import("./lithuania/LithuaniaTimeline")),
}

const FIGURES = {
  "take-me-home-save-dialog": dynamic(() => import("./take-me-home/SaveDialog")),
  "take-me-home-scheduler-path": dynamic(() => import("./take-me-home/SchedulerPath")),
  "ukraine-lavrov-excerpts": dynamic(() => import("./ukraine/LavrovExcerpts")),
  "belarus-key-players": dynamic(() => import("./belarus/KeyPlayersBallot")),
}

// A name with no component behind it: the words still show, as prose.
const Fallback = ({ intro = "", steps = [], closing = "" }) => (
  <div className={styles.prose} dangerouslySetInnerHTML={{ __html: [intro, ...steps, closing].join("\n") }} />
)

export const StoryBlock = ({ name, ...props }) => {
  const Story = STORIES[name]
  return Story ? <Story {...props} /> : <Fallback {...props} />
}

export const StoryFigure = ({ name }) => {
  const Figure = FIGURES[name]
  return Figure ? <Figure /> : null
}
