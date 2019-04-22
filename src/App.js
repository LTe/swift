import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Swift from 'swift-mock';
import JSONPretty from 'react-json-pretty';
import Details from './Details';
import './App.css';
import Validator from "./Validator";
const parser = new Swift();

const FALLBACK_FORMAT = "F01TESTBIC12XXX0360105154\n" +
  "O5641057130214TESTBIC34XXX26264938281302141757N\n" +
  "108:2RDRQDHM3WO"

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      orderJSON: {},
      transactionJSON: {},
      accounts: []
    }

    this.onOrderChange = this.onOrderChange.bind(this);
    this.onTransactionChange = this.onTransactionChange.bind(this);
    this.onAccountChange = this.onAccountChange.bind(this);
  }

  onOrderChange(event) {
    const value = event.target.value
    this.setState({orderJSON: this.parse(value)})
  }

  onTransactionChange(event) {
    const value = event.target.value
    this.setState({transactionJSON: this.parse(value)})
  }

  onAccountChange(event) {
    const value = event.target.value
    const lines = value.split('\n')
    const accounts = lines.map((line) => {
      const accountDetails =line.split(',')
      return { account: accountDetails[0], fund: accountDetails[1], nostro: accountDetails[2] }
    })

    this.setState({accounts: accounts})
  }

  tryParse(value) {
    value = value.replace(/\n{2,}/g, '\n')
    value = value.replace(/ :/g, '\n:')
    value = value.replace(/15A:/g, "15A: ")
    value = value.replace(/15B:/g, "15B: ")

    const lines = value.split('\n')
    const block_1 = "{1:" + lines[0] + "}"
    const block_2 = "{2:" + lines[1] + "}"
    const block_3 = "{3:{" + lines[2] + "}}"
    const block_4 = "{4:\n" + lines.slice(3).join('\n') + "\n-}"

    return parser.parse(block_1 + block_2 + block_3 + block_4)
  }

  parse(value) {
    try {
      return parser.parse(value)
    } catch (e) {
      try {
        return this.tryParse(value)
      } catch (e) {
        try {
          return this.tryParse(FALLBACK_FORMAT + value)
        } catch (e) {
          try {
            return this.tryParse(FALLBACK_FORMAT + ":\n" + value)
          } catch (e) {
            return e.message
          }
        }
      }
    }
  }

  render() {
    return (
      <div>
        <Navbar bg="dark" variant="dark" className="mb-2">
          <Navbar.Brand href="#home">{'Swift Validator'}</Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              Version: <strong>{process.env.REACT_APP_GIT_SHA}</strong>
            </Navbar.Text>
          </Navbar.Collapse>
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
            <Col xs={12}>
              <Validator orderJSON={this.state.orderJSON} transactionJSON={this.state.transactionJSON} accounts={this.state.accounts}/>
            </Col>
          </Row>
          <hr className="col-xs-12"/>
        <Row>
          <Col xs={6}>
            <Details parsedSwift={this.state.orderJSON}></Details>
          </Col>
          <Col xs={6}>
            <Details parsedSwift={this.state.transactionJSON}></Details>
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
        <Row>
          <Col>
            <Form>
              <Form.Group controlId="exampleForm.ControlTextarea1">
                <Form.Control placeholder="Accounts" as="textarea" rows="5" onChange={this.onAccountChange}/>
              </Form.Group>
            </Form>
          </Col>
        </Row>
          <Row>
            <Col>
              <JSONPretty data={this.state.accounts} />
            </Col>
          </Row>
      </Container>
      </div>
    );
  }
}

export default App;
