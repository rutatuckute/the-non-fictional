"use client"

import * as React from "react"

import { CLUB_BOARD, ClubBoard } from "./club"
import { useFollow, useStill } from "./follow"
import { c, useNarrow } from "./parts"
import { PEOPLE, strands } from "./strangers"

const within = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
const gently = t => t * t * (3 - 2 * t)
const mix = (a, b, t) => a + (b - a) * t

// The same seeded threads as the preceding screen, woven into the club's
// squares. Both neighbouring stages overlap this one by a screen, so the
// threads arrive unchanged and the real board takes over in the same place.
export const ThreadBridge = () => {
  const pin = React.useRef(null)
  const canvas = React.useRef(null)
  const board = React.useRef(null)
  const cached = React.useRef(null)
  const still = useStill()
  const narrow = useNarrow()

  useFollow(
    () => Math.max(0, Math.min(1.4, -pin.current.getBoundingClientRect().top / canvas.current.clientHeight)),
    scrolled => {
      const node = canvas.current
      pin.current.dataset.active = pin.current.getBoundingClientRect().top <= 0 ? "true" : "false"
      const club = pin.current.nextElementSibling
      club.dataset.arrived = club.getBoundingClientRect().top <= 0 ? "true" : "false"
      const width = node.clientWidth
      const height = node.clientHeight
      if (!width || !height) return
      const progress = gently(within(scrolled, 0.15, 1.05))
      const reveal = still ? Number(scrolled >= 0.7) : gently(within(scrolled, 0.95, 1.3))
      board.current.style.opacity = String(reveal)
      node.style.opacity = String(still ? 1 - reveal : 1 - within(scrolled, 1.08, 1.35))
      pin.current.dataset.weave = progress.toFixed(3)

      const key = `${width}x${height}`
      if (cached.current?.key !== key) {
        const ratio = Math.min(2, window.devicePixelRatio || 1)
        node.width = Math.round(width * ratio)
        node.height = Math.round(height * ratio)
        cached.current = { key, ratio, list: strands(width, height) }
      }
      const state = cached.current
      const frame = `${still ? "still" : progress.toFixed(4)}:${narrow}`
      if (state.frame === frame) return
      state.frame = frame
      const pen = node.getContext("2d")
      pen.setTransform(state.ratio, 0, 0, state.ratio, 0, 0)
      pen.clearRect(0, 0, width, height)
      const grey = getComputedStyle(node).color.match(/[\d.]+/g).slice(0, 3).map(Number)
      // Read the actual board's layout; resizing uses the same geometry as
      // the following club scene, including its mobile placement.
      const field = board.current.firstElementChild.getBoundingClientRect()
      const origin = node.getBoundingClientRect()
      const scale = field.width / CLUB_BOARD.width
      const x = field.left - origin.left
      const y = field.top - origin.top
      const weave = still ? 0 : progress
      for (let i = 0; i < PEOPLE; i++) {
        const [a, m, b] = state.list[i]
        const tile = i % 64
        const row = Math.floor(tile / 8)
        const file = tile % 8
        const tracks = Math.ceil((PEOPLE - tile) / 64)
        const share = (Math.floor(i / 64) + 0.5) / tracks
        const edges = CLUB_BOARD.x[row]
        const ty = y + mix(CLUB_BOARD.y[row], CLUB_BOARD.y[row + 1], share) * scale
        const left = x + edges[file] * scale
        const right = x + edges[file + 1] * scale
        const colour = (row + file) % 2 ? [197, 139, 159] : [235, 224, 211]
        pen.strokeStyle = `rgb(${grey.map((value, j) => Math.round(mix(value, colour[j], weave))).join(",")})`
        pen.globalAlpha = mix(narrow ? 0.1 : 0.085, 0.95, weave ** 3)
        pen.lineWidth = mix(0.7, (CLUB_BOARD.y[row + 1] - CLUB_BOARD.y[row]) * scale / tracks + 0.3, weave)
        pen.beginPath()
        pen.moveTo(mix(a[0], left, weave), mix(a[1], ty, weave))
        pen.quadraticCurveTo(mix(m[0], (left + right) / 2, weave), mix(m[1], ty, weave), mix(b[0], right, weave), mix(b[1], ty, weave))
        pen.stroke()
      }
    },
    { still, watch: canvas },
  )

  return (
    <section className={c("ch-pin", "ch-threadBridge")} ref={pin} data-open="true" data-reading={!narrow ? "true" : undefined} data-plain={narrow ? "true" : undefined} aria-label="The threads weave into the pink chessboard">
      <div className={c("ch-stage")}>
        <div className={c("ch-scene")} aria-hidden="true">
          <div className={c("ch-games")}>
            <div className={c("ch-boardwrap")} data-view="club">
              <div className={c("ch-layer", "ch-clubBoard")} data-on="true" ref={board}>
                <ClubBoard during={-1} />
              </div>
            </div>
          </div>
        </div>
        <canvas className={c("ch-many")} ref={canvas} aria-hidden="true" />
      </div>
    </section>
  )
}
