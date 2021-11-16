import * as React from "react"
import { Nav, Navbar } from 'react-bootstrap'

import logo from "../images/logo.jpeg"

const Navigation = () => {

    return (
      <Navbar bg="black" variant="dark" expand="lg">
        <Navbar.Brand>
          <img src={logo} alt="non fictional" />
        </Navbar.Brand>
        <Navbar.Toggle/>
        <Navbar.Collapse>
        <Nav className="justify-content-end" style={{ width: "100%" }}>
          <Nav.Link href="/blog">Blog</Nav.Link>
          <Nav.Link href="/photography">Photography</Nav.Link>
          <Nav.Link href="/about">In Brief</Nav.Link>
          <Nav.Link href="/contacts">Contacts</Nav.Link>
        </Nav>
        </Navbar.Collapse>
        </Navbar>
    )
}

export default Navigation