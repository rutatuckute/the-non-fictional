import * as React from "react"
import Layout from "../components/layout"

const BlogIndex = ({location}) => {
  return (
    <Layout location={location}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '90vh'
      }}
    >
      <h1>Blog</h1>
    </div>
    </Layout>
  );
};

export default BlogIndex