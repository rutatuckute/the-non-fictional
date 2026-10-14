"use client"

import * as React from "react"

import styles from "./take-me-home.module.css"

// Notepad's "Save as", working, in place of the screenshot: type a name, pick
// a type, save, and see what Windows makes of the file — the point the
// screenshot was there to make.
const c = (...names) => names.map(name => styles[name]).filter(Boolean).join(" ")

const SaveDialog = () => {
  const [name, setName] = React.useState("skyscanner.bat")
  const [type, setType] = React.useState("txt")
  const [saved, setSaved] = React.useState(null)

  const save = event => {
    event.preventDefault()
    const typed = name.trim() || "Untitled"
    // Notepad adds .txt only when the name carries no extension of its own.
    const file = /\.[a-z0-9]+$/i.test(typed) ? typed : `${typed}${type === "txt" ? ".txt" : ""}`
    const ext = (file.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase()
    setSaved({ file, ok: ext === "bat" })
  }
  const reset = () => {
    setName("skyscanner.bat")
    setType("txt")
    setSaved(null)
  }

  return (
    <figure className={c("sv")}>
      <div className={c("sv-head")}><span className={c("sv-app")}>Notepad</span><span>Save as</span></div>
      <form className={c("sv-body")} onSubmit={save} onReset={reset}>
        <label className={c("sv-row")}>
          <span className={c("sv-label")}>File name</span>
          <input value={name} onChange={event => { setName(event.target.value); setSaved(null) }} spellCheck="false" />
        </label>
        <label className={c("sv-row")}>
          <span className={c("sv-label")}>Save as type</span>
          <select value={type} onChange={event => { setType(event.target.value); setSaved(null) }}>
            <option value="txt">Text Documents (*.txt)</option>
            <option value="all">All Files (*.*)</option>
          </select>
        </label>
        <div className={c("sv-foot")}>
          <label className={c("sv-enc")}>
            <span className={c("sv-label")}>Encoding</span>
            <select defaultValue="utf8"><option value="utf8">UTF-8</option><option value="ansi">ANSI</option></select>
          </label>
          <button type="submit" className={c("sv-save")}>Save</button>
          <button type="reset" className={c("sv-cancel")}>Cancel</button>
        </div>
      </form>
      <p className={c("sv-result")} data-state={saved ? (saved.ok ? "ok" : "warn") : "idle"} aria-live="polite">
        {!saved ? <>Try it: type a name and press <b>Save</b>.</>
          : saved.ok ? <>Saved as <b>{saved.file}</b>. Windows will run it as a batch file, which is what the scheduler needs.</>
          : <>Saved as <b>{saved.file}</b>. Windows would only open that in Notepad. End the name in <b>.bat</b> to make it run.</>}
      </p>
    </figure>
  )
}

export default SaveDialog
