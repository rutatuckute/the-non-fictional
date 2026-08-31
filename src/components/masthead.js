import * as React from "react"
import { Link } from "gatsby"

import logo from "../images/logo.jpeg"
import * as styles from "./masthead.module.css"

const navigation = [
  { label: "STRUCTURE", to: "/", section: "structure" },
  { label: "WRITINGS", to: "/blog/", section: "writings" },
  { label: "PHOTOGRAPHY", to: "/photography/", section: "photography" },
  { label: "IN BRIEF", to: "/about/", section: "in-brief" },
]

const getActiveSection = (pathname = "/") => {
  if (pathname === "/") return "structure"
  if (pathname.startsWith("/blog")) return "writings"
  if (pathname.startsWith("/photography")) return "photography"
  if (pathname.startsWith("/about")) return "in-brief"
  return null
}

const Masthead = ({ location, activeSection }) => {
  const active = activeSection || getActiveSection(location?.pathname)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuButton = React.useRef(null)

  const closeMenu = React.useCallback(() => setMenuOpen(false), [])

  React.useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu()
        // Send focus back to the control that opened the drawer.
        menuButton.current?.focus()
      }
    }

    // The page behind the drawer should not scroll while it is open.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [closeMenu, menuOpen])

  return (
    <header className={styles.header}>
      <Link className={styles.brand} to="/" aria-label="The Non Fictional home">
        <img className={styles.brandLogo} src={logo} alt="" />
        <span>The Non Fictional</span>
      </Link>

      <nav className={styles.navigation} aria-label="Primary navigation">
        {navigation.map((item) => (
          <Link
            className={active === item.section ? styles.currentNavItem : undefined}
            key={item.section}
            to={item.to}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        className={styles.menuToggle}
        type="button"
        ref={menuButton}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="masthead-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      </button>

      <div
        className={styles.menuBackdrop}
        data-open={menuOpen ? "true" : "false"}
        aria-hidden="true"
        onClick={closeMenu}
      />

      <div
        className={styles.menu}
        id="masthead-menu"
        data-open={menuOpen ? "true" : "false"}
        aria-label="Primary navigation"
      >
        <button
          className={styles.menuClose}
          type="button"
          aria-label="Close menu"
          onClick={() => {
            closeMenu()
            menuButton.current?.focus()
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>

        <nav className={styles.menuNav} aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link
              className={
                active === item.section ? styles.currentMenuItem : undefined
              }
              key={item.section}
              to={item.to}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Masthead
