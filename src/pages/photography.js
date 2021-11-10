import * as React from "react"
import Layout from "../components/layout"

const Photography = ({location}) => {
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
      <h1>Photography</h1>
    </div>
    </Layout>
  );
};

export default Photography
