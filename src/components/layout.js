import * as React from "react"

import Masthead from "./masthead"
import SiteFooter from "./site-footer"

const Layout = ({ location, children, activeSection }) => {
  return (
    <>
      <Masthead location={location} activeSection={activeSection} />

      <div className="global-wrapper" data-is-root-path={location.pathname === `${__PATH_PREFIX__}/`}>
        <main>{children}</main>
      </div>

      <SiteFooter />
    </>
  )

}

export default Layout
