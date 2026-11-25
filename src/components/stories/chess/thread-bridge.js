"use client"

import * as React from "react"

import { CLUB_BOARD, ClubBoard } from "./club"
import { c } from "./parts"
import { PEOPLE, strands } from "./strangers"

const within = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
const gently = t => t * t * (3 - 2 * t)
const mix = (a, b, t) => a + (b - a) * t

// One canvas from the first accumulating threads through the final weave.
// Wooden owns the timeline, so neither the image nor the copy is replaced
// by a second pinned scene. The phone's actual two paths become the first
// two strands: no replacement lines appear at the handoff.
export const ThreadBridge = React.forwardRef(function ThreadBridge({ narrow }, ref) {
  const canvas = React.useRef(null)
  const board = React.useRef(null)
  const cached = React.useRef(null)

  React.useImperativeHandle(ref, () => ({
    paint({ share, joined, scrolled, still, narrow, threads }) {
      const node = canvas.current
      const width = node.clientWidth
      const height = node.clientHeight
      if (!width || !height) return
      const progress = gently(within(scrolled, 0.15, 1.05))
      const reveal = still ? Number(scrolled >= 0.7) : gently(within(scrolled, 0.95, 1.3))
      board.current.style.opacity = String(reveal)
      node.style.opacity = String(still ? 1 - reveal : 1 - within(scrolled, 1.08, 1.35))
      node.dataset.weave = progress.toFixed(3)

      const key = `${width}x${height}`
      if (cached.current?.key !== key) {
        const ratio = Math.min(2, window.devicePixelRatio || 1)
        node.width = Math.round(width * ratio)
        node.height = Math.round(height * ratio)
        cached.current = { key, ratio, list: strands(width, height), sources: [] }
      }
      const state = cached.current
      const count = Math.round(share * PEOPLE)
      const pen = node.getContext("2d")
      pen.setTransform(state.ratio, 0, 0, state.ratio, 0, 0)
      const grey = getComputedStyle(node).color.match(/[\d.]+/g).slice(0, 3).map(Number)
      // Read the actual board's layout; resizing uses the same geometry as
      // the following club scene, including its mobile placement.
      const field = board.current.firstElementChild.getBoundingClientRect()
      const origin = node.getBoundingClientRect()
      const scale = field.width / CLUB_BOARD.width
      const x = field.left - origin.left
      const y = field.top - origin.top
      const weave = still ? 0 : progress
      const tileAt = i => {
        const tile = i % 64
        const row = Math.floor(tile / 8)
        const file = tile % 8
        const tracks = Math.ceil((PEOPLE - tile) / 64)
        const track = (Math.floor(i / 64) + 0.5) / tracks
        const edges = CLUB_BOARD.x[row]
        const ty = y + mix(CLUB_BOARD.y[row], CLUB_BOARD.y[row + 1], track) * scale
        const left = x + edges[file] * scale
        const right = x + edges[file + 1] * scale
        const colour = (row + file) % 2 ? [197, 139, 159] : [235, 224, 211]
        return { left, right, ty, colour, weight: (CLUB_BOARD.y[row + 1] - CLUB_BOARD.y[row]) * scale / tracks + 0.3 }
      }
      // Keep the existing SVG elements, including their colour and entry
      // points. Sample only when their source geometry changes (or resizes).
      // Both the originals and the field use the same seeded destinations.
      threads.forEach((path, i) => {
        if (!path) return
        if (!joined) {
          for (const property of ["stroke", "stroke-width", "stroke-opacity"]) path.style.removeProperty(property)
          if (!i) path.style.opacity = "1"
          return
        }
        const d = path.getAttribute("d")
        if (state.sources[i]?.d !== d) {
          const length = path.getTotalLength()
          state.sources[i] = { d, points: Array.from({ length: 65 }, (_, step) => {
            const point = path.getPointAtLength(length * step / 64)
            return [point.x, point.y]
          }) }
        }
        const [a, m, b] = state.list[i]
        const { left, right, ty, colour, weight } = tileAt(i)
        const offset = path.ownerSVGElement.getBoundingClientRect()
        const dx = origin.left - offset.left
        const dy = origin.top - offset.top
        const points = state.sources[i].points.map((point, step) => {
          const t = step / 64
          const fx = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * m[0] + t ** 2 * b[0]
          const fy = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * m[1] + t ** 2 * b[1]
          return `${step ? "L" : "M"}${mix(point[0], mix(fx, mix(left, right, t), weave) + dx, joined).toFixed(2)},${mix(point[1], mix(fy, ty, weave) + dy, joined).toFixed(2)}`
        })
        path.setAttribute("d", points.join(" "))
        path.style.removeProperty("stroke")
        const tint = getComputedStyle(path).stroke.match(/[\d.]+/g).slice(0, 3).map(Number)
        path.style.stroke = `rgb(${tint.map((value, j) => Math.round(mix(value, colour[j], weave))).join(",")})`
        path.style.strokeWidth = String(mix(mix(1.3, 0.7, joined), weight, weave))
        path.style.strokeOpacity = "1"
        path.style.opacity = String(mix(mix(i ? 0.75 : 1, i ? 0.25 : 0.6, joined), 0.95, weave ** 3) * Number(node.style.opacity))
        path.style.strokeDasharray = "none"
        path.style.strokeDashoffset = "0"
      })
      const frame = `${still ? "still" : progress.toFixed(4)}:${narrow}:${count}`
      if (state.frame === frame) return
      state.frame = frame
      pen.clearRect(0, 0, width, height)
      // The first two belong to the existing SVG paths above.
      for (let i = 2; i < count; i++) {
        const [a, m, b] = state.list[i]
        const { left, right, ty, colour, weight } = tileAt(i)
        pen.strokeStyle = `rgb(${grey.map((value, j) => Math.round(mix(value, colour[j], weave))).join(",")})`
        pen.globalAlpha = mix(narrow ? 0.1 : 0.085, 0.95, weave ** 3)
        pen.lineWidth = mix(0.7, weight, weave)
        pen.beginPath()
        pen.moveTo(mix(a[0], left, weave), mix(a[1], ty, weave))
        pen.quadraticCurveTo(mix(m[0], (left + right) / 2, weave), mix(m[1], ty, weave), mix(b[0], right, weave), mix(b[1], ty, weave))
        pen.stroke()
      }
    },
  }))

  return (
    <div className={c("ch-pin", "ch-threadWeave")} data-open="true" data-reading={!narrow ? "true" : undefined} data-plain={narrow ? "true" : undefined} aria-hidden="true">
      <div className={c("ch-scene")}>
        <div className={c("ch-games")}>
          <div className={c("ch-boardwrap")} data-view="club">
            <div className={c("ch-layer", "ch-clubBoard")} data-on="true" ref={board}>
              <ClubBoard during={-1} />
            </div>
          </div>
        </div>
      </div>
      <canvas className={c("ch-many")} ref={canvas} />
    </div>
  )
})
