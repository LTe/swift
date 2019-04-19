import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Swift from 'swift-mock';
import JSONPretty from 'react-json-pretty';
import './App.css';

const parser = new Swift();

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      orderJSON: {},
      transactionJSON: {}
    }

    this.onOrderChange = this.onOrderChange.bind(this);
    this.onTransactionChange = this.onTransactionChange.bind(this);
  }

  onOrderChange(event) {
    const value = event.target.value
    this.setState({orderJSON: parser.parse(value)})
  }

  onTransactionChange(event) {
    const value = event.target.value
    this.setState({transactionJSON: parser.parse(value)})
  }

  render() {
    return (
      <div>
        <Navbar bg="dark" variant="dark" className="mb-2">
          <Navbar.Brand href="#home">
            {'Swift Validator'}
          </Navbar.Brand>
        </Navbar>
        <Container className="mb-0">
        <Row>
          <Col>
            <Form>
              <Form.Group controlId="exampleForm.ControlTextarea1">
                <Form.Control placeholder="Swift order" as="textarea" rows="20" onChange={this.onOrderChange} />
              </Form.Group>
            </Form>
          </Col>
          <Col>
            <Form>
              <Form.Group controlId="exampleForm.ControlTextarea1">
                <Form.Control placeholder="Swift transaction" as="textarea" rows="20" onChange={this.onTransactionChange} />
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col xs={6}>
            <JSONPretty data={this.state.orderJSON} />
          </Col>
          <Col xs={6}>
            <JSONPretty data={this.state.transactionJSON} />
          </Col>
        </Row>
      </Container>
      </div>
    );
  }
}

export default App;
