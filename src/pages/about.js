import * as React from "react"
import Layout from "../components/layout"
import { Container, Row, Col } from 'react-bootstrap'
import PhotoImage from "../components/photo-image"


const About = ({ location }) => {

  return (
    <Layout location={location}>
      <Container flex className="bref-container">
      <Row className="justify-content-md-center">
        <Col md="auto">
          <h1 class="bref">In Brief</h1>
        </Col>
        <Col md="auto">
          <PhotoImage
            source="/images/uploads/site-about-icon.png"
            px={640}
            quality="normal"
            alt=""
            style={{ height: "300px" }}
          />
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