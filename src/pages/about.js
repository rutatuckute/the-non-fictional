import * as React from "react"
import Layout from "../components/layout"
import { Container, Row, Col } from 'react-bootstrap'


const About = ({ location }) => {

  return (
    <Layout location={location}>
      <Container flex className="bref-container">
      <Row className="justify-content-md-center">
        <Col md="auto">
          <h1 class="bref">In Brief</h1>
        </Col>
        <Col md="auto">
          <img src="https://ucarecdn.com/92e473be-2fa6-443b-9f58-998156630420/iconII.png" style={{height:"300px"}}></img>
        </Col>
        <Col md="auto">
          <p class="bref">I never felt like writing anything fictional.</p>
        </Col>
      </Row>
      </Container>
    </Layout>

  );
};

export default About