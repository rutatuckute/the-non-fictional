import * as React from "react"
import { Card, Container, Row, Form, Button } from 'react-bootstrap'

const ContactForm = () => {

    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Card border="secondary" className="data">
                    <Card.Body>
                    <Form name="contacts" method="post" data-netlify="true">
                    <input type="hidden" name="form-name" value="contacts"/>
                    <Form.Group className="mb-3" controlId="formPlaintext">
                        <Form.Label>Name</Form.Label>
                            <Form.Control type="text" name="name"/>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" name="email"/>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                            <Form.Label>Your message</Form.Label>
                            <Form.Control as="textarea" rows={3} name="message"/>
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Row>
      </Container>
    )
}

export default ContactForm