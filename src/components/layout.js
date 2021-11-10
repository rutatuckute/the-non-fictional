import * as React from "react"
import { Link, graphql, useStaticQuery } from "gatsby"

import Navbar from "./navbar"

const Layout = ({ location, children }) => {

  const data = useStaticQuery(graphql`
            query {
              site {
                siteMetadata {
                    title
                      author {
                        name
                }
              }
            }
          }
  `)

  const title = data.site.siteMetadata.title
  const author = data.site.siteMetadata.author.name

  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    )
  } else {
    header = (
      <h1 className="header-link-home">
      <Link to="/">{title}</Link>
      </h1>
    )
  }

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <Navbar/>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
        © {new Date().getFullYear()} <span>{author}</span>
      </footer>
    </div>
  )
}

export default Layout
