import * as React from "react"
import Layout from "../components/layout"
import Form from "../components/form"

const Contacts = ({location}) => {
  return (
    <Layout location={location}>
      <Form/>
    </Layout>
  );
};

export default Contacts