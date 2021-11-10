import * as React from "react"
import Layout from "../components/layout"

const Contacts = ({location}) => {
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
      <h1>Contacts</h1>
    </div>
    </Layout>
  );
};

export default Contacts