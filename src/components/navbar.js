import * as React from "react"
import { Link } from "gatsby"
import { Nav, Navbar, NavDropdown } from 'react-bootstrap'

import logo from "../images/logo.jpeg"


const Navigation = () => {

    return (
      <Navbar bg="black" variant="dark" sticky="top" expand="lg" className="test-test">
        <Navbar.Brand>
          {/* <img src={logo} alt="non fictional" /> */}
          Logo
        </Navbar.Brand>
        <Navbar.Toggle/>
        <Navbar.Collapse>
        <Nav className="test">
          <NavDropdown title="Blog">
            <NavDropdown.Item href="/blog">Coding</NavDropdown.Item>
            <NavDropdown.Item href="/blog">Data</NavDropdown.Item>
          </NavDropdown>
          <Nav.Link href="/photography">Photography</Nav.Link>
          <Nav.Link href="/about">In Brief</Nav.Link>
          <Nav.Link href="/contacts">Contacts</Nav.Link>
        </Nav>
        </Navbar.Collapse>
        </Navbar>
    )
}

export default Navigation