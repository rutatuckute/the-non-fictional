import * as React from "react"
import { PageProps, Link, graphql } from "gatsby"

import Layout from "../components/layout"

type DataProps = {
  site: {
    buildTime: string
  }
}

const UsingTypescript: React.FC<PageProps<DataProps>> = ({
  data,
  path,
  location,
}) => {
  return (
    <Layout title="Using TypeScript" location={location}>
      <h1>Gatsby supports TypeScript by default!</h1>

      <p>
        This means that you can create and write <em>.ts/.tsx</em> files for your
        pages and components.
      </p>

      <p>
        You are currently on the page <strong>{path}</strong>, built on{" "}
        {data.site.buildTime}.
      </p>

      <p>
        Learn more in the{" "}
        <a href="https://www.gatsbyjs.com/docs/typescript/">
          Gatsby TypeScript documentation
        </a>
        .
      </p>

      <Link to="/">← Go back to the homepage</Link>
    </Layout>
  )
}

export default UsingTypescript


export const Head = () => (
  <>
    <title>Using TypeScript</title>
    <meta name="robots" content="noindex" />
  </>
)

export const query = graphql`
  {
    site {
      buildTime(formatString: "YYYY-MM-DD HH:mm z")
    }
  }
`
