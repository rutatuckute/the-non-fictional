import * as React from "react"

import Layout from "../components/layout"


const PhotoPostTemplate = ({ data, location }) => {

  const siteTitle = data.site.siteMetadata?.title || `Title`

  return (
    <Layout location={location} title={siteTitle}>
    </Layout>
  )
}

export default PhotoPostTemplate
