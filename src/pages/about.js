import * as React from "react"
import Layout from "../components/layout"

const About = ({ location }) => {

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
      <h1>In Brief</h1>
    </div>
    </Layout>

  );
};

export default About