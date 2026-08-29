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
    </header>
  )
}

export default Masthead
