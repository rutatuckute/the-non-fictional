import * as React from "react"
import Layout from "../components/layout"
import ContactForm from "../components/form"

const Contacts = ({location}) => {
  return (
    <Layout location={location}>
      <ContactForm/>
    </Layout>
  );
};

export default Contacts