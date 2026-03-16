import * as React from "react"
import { Nav, Navbar } from 'react-bootstrap'

const Navigation = () => {
  return (
    <nav className="main-nav">
      <Nav>
        <Nav.Link href="/">Front</Nav.Link>
        <Nav.Link href="/blog">Writings</Nav.Link>
        <Nav.Link href="/photography">Photography</Nav.Link>
        <Nav.Link href="/about">In Brief</Nav.Link>
      </Nav>
    </nav>
  )
}

export default Navigation