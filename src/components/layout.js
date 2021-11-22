import * as React from "react"
import { Link, graphql, useStaticQuery } from "gatsby"
import {Card} from 'react-bootstrap'

import Navigation from "./navbar"

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
      <Navigation/>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <Card className="footer" bg="black">
      <Card.Body>
        <Card.Text>
          © {new Date().getFullYear()} <span>{author}</span>
        </Card.Text>
      </Card.Body>
      {/* <footer>
        © {new Date().getFullYear()} <span>{author}</span>
      </footer> */}
      </Card>
    </div>
  )
}

export default Layout