import * as React from "react"
import { Card, Container, Row } from 'react-bootstrap'

const Form = () => {

    return (
        <Container fluid>
            <Row className="justify-content-md-center">
                <Card border="secondary" className="data">
                    <Card.Body>
                    <form name="contacts" method="post" data-netlify="true">
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
                </form>
                </Card.Body>
            </Card>
        </Row>
      </Container>
    )
}

export default Form