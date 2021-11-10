import * as React from "react"
import { Link } from "gatsby"

import logo from "../images/logo.jpeg"


const Navbar = () => {

  return (
    <nav className="navbar">
      <div className="nav-center">
        <div className="nav-header">
            <Link to="/" className="navbar-item" title="Logo">
            <img src={logo} alt="non fictional" />
            </Link>
        </div>
        <div className="nav-list">
            <Link to="/" className="navbar-item" title="Logo">
                <img src={logo} alt="non fictional" />
                </Link>
              <Link className="navbar-item" to="/blog">
                Blog
              </Link>
              <Link className="navbar-item" to="/photography">
                Photography
              </Link>
              <Link className="navbar-item" to="/about">
                In Brief
              </Link>
              <Link className="navbar-item" to="/contacts">
                Contacts
              </Link>
            </div>
      </div>
    </nav>
  )
}

export default Navbar