import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Swift from 'swift-mock';
import './App.css';

class App extends Component {
    render() {
        return (
          <div>
              <Navbar bg="dark" variant="dark">
                  <Navbar.Brand href="#home">
                      {'Swift Validator'}
                  </Navbar.Brand>
              </Navbar>
              <Container>
                  <Row>
                      <Col>
                          <Form>
                              <Form.Group controlId="exampleForm.ControlTextarea1">
                                  <Form.Control placeholder="Swift order" as="textarea" rows="20" />
                              </Form.Group>
                          </Form>
                      </Col>
                      <Col>
                          <Form>
                              <Form.Group controlId="exampleForm.ControlTextarea1">
                                  <Form.Control placeholder="Swift transaction" as="textarea" rows="20" />
                              </Form.Group>
                          </Form>
                      </Col>
                  </Row>
                  <Row>
                      <Col>1 of 3</Col>
                      <Col>2 of 3</Col>
                  </Row>
              </Container>
          </div>
        );
    }
}

export default App;
