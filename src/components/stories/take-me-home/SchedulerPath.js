"use client"

import * as React from "react"

import styles from "./take-me-home.module.css"

// The way to the Task Scheduler, in place of the screenshot: its four stages
// with its icons, redrawn as line icons. Each stage lights in the form's
// colour as it is reached; the last opens the wizard it leads to.
const c = (...names) => names.map(name => styles[name]).filter(Boolean).join(" ")

const Icon = ({ children }) => (
  <svg className={c("sp-icon")} viewBox="0 0 48 48" aria-hidden="true" focusable="false">{children}</svg>
)

const ICONS = {
  panel: <><rect x="5" y="9" width="38" height="28" rx="3" /><path d="M18 43h12" /><circle cx="17" cy="21" r="6" /><path d="M17 15v6h6" /><path d="M28 17h9" /><path d="M28 23h9" /><path d="M28 29h9" /><circle cx="33" cy="17" r="1.6" /><circle cx="31" cy="23" r="1.6" /><circle cx="35" cy="29" r="1.6" /></>,
  tools: <><circle cx="17" cy="16" r="5" /><path d="M17 6v4M17 22v4M7 16h4M23 16h4M10 9l3 3M21 20l3 3M24 9l-3 3M13 20l-3 3" /><rect x="22" y="22" width="20" height="20" rx="2" /><path d="M26 28l2 2 3-3M26 35l2 2 3-3" /><path d="M33 29h5M33 36h5" /></>,
  clock: <><circle cx="24" cy="24" r="17" /><path d="M24 12v12h9" /><path d="M24 24L24 7A17 17 0 0 1 41 24Z" className={c("sp-fill")} /></>,
  task: <><rect x="9" y="6" width="30" height="36" rx="2" /><path d="M16 15h16M16 22h16M16 29h16M16 36h10" /><circle cx="13" cy="15" r="0.8" /><circle cx="13" cy="22" r="0.8" /><circle cx="13" cy="29" r="0.8" /><circle cx="13" cy="36" r="0.8" /></>,
}

const STAGES = [
  { id: "panel", label: "Control Panel", how: <>Open the Start menu and type <b>Control Panel</b>.</> },
  { id: "tools", label: "Administrative Tools", how: <>In Control Panel, under <b>System and Security</b>, open <b>Administrative Tools</b>.</> },
  { id: "clock", label: "Task Scheduler", how: <>Double-click <b>Task Scheduler</b> in the list.</> },
  { id: "task", label: "Create Basic Task", how: <>In the <b>Actions</b> pane on the right, choose <b>Create Basic Task…</b> and follow the four steps.</> },
]
const WIZARD = ["Name your task", "Select a trigger", "Find your batch file", "Finish"]
const TRIGGERS = ["Daily", "Weekly", "Monthly", "One time"]

const SchedulerPath = () => {
  const [stage, setStage] = React.useState(0)
  const [page, setPage] = React.useState(0)
  const [task, setTask] = React.useState("Take me home")
  const [trigger, setTrigger] = React.useState("Daily")
  const group = React.useId()
  const last = stage === STAGES.length - 1

  return (
    <figure className={c("sp")}>
      <ol className={c("sp-path")}>
        {STAGES.map((s, index) => (
          <li key={s.id} data-state={index < stage ? "done" : index === stage ? "on" : "next"}>
            <button type="button" onClick={() => { setStage(index); setPage(0) }} aria-current={index === stage ? "step" : undefined}>
              <Icon>{ICONS[s.id]}</Icon>
              <span className={c("sp-label")}>{s.label}</span>
            </button>
            {index < STAGES.length - 1 ? <span className={c("sp-arrow")} aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
      <div className={c("sp-detail")}>
        <p className={c("sp-how")}><span className={c("sp-no")}>{stage + 1}/4</span>{STAGES[stage].how}</p>
        {last ? (
          <div className={c("sp-wizard")}>
            <ol className={c("sp-pages")}>
              {WIZARD.map((w, index) => (
                <li key={w}>
                  <button type="button" data-on={page === index ? "true" : "false"} data-done={index < page ? "true" : "false"} onClick={() => setPage(index)}>{w}</button>
                </li>
              ))}
            </ol>
            <div className={c("sp-page")}>
              {page === 0 ? (
                <label className={c("sv-row")}>
                  <span className={c("sv-label")}>Name</span>
                  <input value={task} onChange={event => setTask(event.target.value)} />
                </label>
              ) : null}
              {page === 1 ? (
                <div className={c("sp-radios")} role="radiogroup" aria-label="When do you want the task to start?">
                  {TRIGGERS.map(option => (
                    <label key={option}><input type="radio" name={group} checked={trigger === option} onChange={() => setTrigger(option)} />{option}</label>
                  ))}
                </div>
              ) : null}
              {page === 2 ? (
                <div className={c("sp-file")}>
                  <span className={c("sv-label")}>Start a program</span>
                  <code>C:\Users\ruttuc\Desktop\take_me_home\skyscanner.bat</code>
                </div>
              ) : null}
              {page === 3 ? (
                <dl className={c("sp-summary")}>
                  <div><dt>Name</dt><dd>{task || "Untitled"}</dd></div>
                  <div><dt>Trigger</dt><dd>{trigger}</dd></div>
                  <div><dt>Action</dt><dd>Start skyscanner.bat</dd></div>
                </dl>
              ) : null}
              <div className={c("sp-nav")}>
                {page > 0 ? <button type="button" className={c("sv-cancel")} onClick={() => setPage(page - 1)}>Back</button> : null}
                {page < WIZARD.length - 1
                  ? <button type="button" className={c("sv-save")} onClick={() => setPage(page + 1)}>Next</button>
                  : <span className={c("sp-done")}>Done: the script runs {trigger === "One time" ? "once" : trigger.toLowerCase()}.</span>}
              </div>
            </div>
          </div>
        ) : (
          <button type="button" className={c("sv-save", "sp-next")} onClick={() => setStage(stage + 1)}>Next: {STAGES[stage + 1].label} →</button>
        )}
      </div>
    </figure>
  )
}

export default SchedulerPath
