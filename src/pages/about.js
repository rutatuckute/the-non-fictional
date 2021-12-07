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
        height: '60vh'
      }}
    >
      <h1>In Brief</h1>
      
      <img src="https://ucarecdn.com/92e473be-2fa6-443b-9f58-998156630420/iconII.png" style={{height:"300px"}}></img>
      <p style={{color:"white"}}>I never felt like writing anything fictional.</p>
    </div>
    </Layout>

  );
};

export default About