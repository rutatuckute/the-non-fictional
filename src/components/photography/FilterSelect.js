import * as React from "react"

import * as styles from "../../pages/photography.module.css"

// A native <select> cannot be styled once it is open — the option list is drawn
// by the OS and ignores the page's palette. This is a custom listbox so the
// open state matches the rest of the page, and so several values can be picked.
const FilterSelect = ({ label, options, selected, onToggle, onClear }) => {
  const [open, setOpen] = React.useState(false)
  const container = React.useRef(null)

  React.useEffect(() => {
    if (!open) {
      return undefined
    }

    const onPointerDown = (event) => {
      if (!container.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const summary =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`

  return (
    <div
      className={styles.select}
      ref={container}
      data-on={selected.length ? "true" : "false"}
    >
      <button
        className={styles.selectButton}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.selectLabel}>{label}</span>
        <span className={styles.selectValue}>{summary}</span>
        <svg
          className={styles.selectChevron}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open ? (
        <div className={styles.selectMenu} role="listbox" aria-multiselectable>
          {options.map((option) => {
            const isSelected = selected.includes(option.value)

            return (
              <button
                className={styles.selectOption}
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-on={isSelected ? "true" : "false"}
                onClick={() => onToggle(option.value)}
              >
                <span className={styles.selectTick} aria-hidden="true">
                  {isSelected ? "✓" : ""}
                </span>
                {option.label}
              </button>
            )
          })}

          {selected.length ? (
            <button
              className={styles.selectReset}
              type="button"
              onClick={onClear}
            >
              Clear {label.toLowerCase()}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default FilterSelect
