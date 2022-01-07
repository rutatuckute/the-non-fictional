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
                            <Form.Control type="text" defaultValue="Name" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" placeholder="Enter email" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                            <Form.Label>Your message</Form.Label>
                            <Form.Control as="textarea" rows={3} />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                    {/* <form name="contacts" method="post" data-netlify="true">
                        <input type="hidden" name="form-name" value="contacts"/>
                    <p>
                    <label htmlFor="name">Name</label> <br />
                    <input className="form-inputs" type="text" id="name" name="name" required />
                    </p>
                    <p>
                    <label htmlFor="email">Email</label> <br />
                    <input className="form-inputs" type="email" id="email" name="email" required />
                    </p>
                    <p>
                    <label htmlFor="message">Your Message</label> <br />
                    <textarea cols="40" row="5" id="message" name="message" required></textarea>
                    </p>
                    <p>
                    <input type="submit" value="Submit" />
                    </p>
                </form> */}
                </Card.Body>
            </Card>
        </Row>
      </Container>
    )
}

export default ContactForm