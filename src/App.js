import React, {Component} from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import SwiftParser from 'swift-mock/lib/swiftParser';
import JSONPretty from 'react-json-pretty';
import Details from './Details';
import './App.css';
import Validator from "./Validator";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Duplicate from "./Duplicate";
import {isEqual} from "underscore";

const parser = new SwiftParser();

const FALLBACK_FORMAT = "F01TESTBIC12XXX0360105154\n" +
    "O5641057130214TESTBIC34XXX26264938281302141757N\n" +
    "108:2RDRQDHM3WO"

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderJSON: {},
      transactionJSON: {},
      accounts: [],
      isDuplicate: false,
      duplicateValues: []
    }

    this.onOrderChange = this.onOrderChange.bind(this);
    this.onTransactionChange = this.onTransactionChange.bind(this);
    this.onAccountChange = this.onAccountChange.bind(this);
    this.duplicateCheck = this.duplicateCheck.bind(this);
  }

  duplicateCheck(event) {
    const swifts = event.target.value.split(/\n{2,}/)
    const mappedSwifts = swifts.map((swift) => {
      return this.parse(swift)
    })
    const duplicatedOrders = mappedSwifts.filter((order) => {
      return mappedSwifts.filter(
      (swift) => {
        return isEqual(swift, order)
      }).length > 1
    })
    const duplicateDetected = duplicatedOrders.length > 0

    this.setState(
      {
        isDuplicate: duplicateDetected,
        duplicateValues: duplicatedOrders
      }
    )
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
      const accountDetails = line.split(',')
      const fundAccount = (accountDetails[1] || '').slice(0, -5) + '5-000'
      return {account: accountDetails[0], fund: fundAccount, nostro: accountDetails[2]}
    })

    this.setState({accounts: accounts})
  }

  tryParse(value) {
    value = value.replace(/\n{2,}/g, '\n')
    value = value.replace(/ :/g, '\n:')

    const lines = value.split('\n')
    const block_1 = "{1:" + lines[0] + "}"
    const block_2 = "{2:" + lines[1] + "}"
    const block_3 = "{3:{" + lines[2] + "}}"
    const block_4 = "{4:\n" + lines.slice(3).join('\n').replace('\n-', '').trim() + "\n-}"

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
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link href="./static.html">Static Version</Nav.Link>
              </Nav>
            </Navbar.Collapse>
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text>
                Version: <strong>{process.env.REACT_APP_GIT_SHA}</strong>
              </Navbar.Text>
            </Navbar.Collapse>
          </Navbar>
          <Tabs defaultActiveKey="home" id="uncontrolled-tab-example">
            <Tab eventKey="home" title="Validator">
              <Container className="mb-2 mt-sm-2">
                <Row>
                  <Col>
                    <Form>
                      <Form.Group controlId="exampleForm.ControlTextarea1">
                        <Form.Control placeholder="Swift order" as="textarea" rows="20" onChange={this.onOrderChange}/>
                      </Form.Group>
                    </Form>
                  </Col>
                  <Col>
                    <Form>
                      <Form.Group controlId="exampleForm.ControlTextarea1">
                        <Form.Control placeholder="Swift transaction" as="textarea" rows="20"
                                      onChange={this.onTransactionChange}/>
                      </Form.Group>
                    </Form>
                  </Col>
                </Row>
                <Row>
                  <Col xs={12}>
                    <Validator orderJSON={this.state.orderJSON} transactionJSON={this.state.transactionJSON}
                               accounts={this.state.accounts}/>
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
                    <JSONPretty data={this.state.orderJSON}/>
                  </Col>
                  <Col xs={6}>
                    <JSONPretty data={this.state.transactionJSON}/>
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
                    <JSONPretty data={this.state.accounts}/>
                  </Col>
                </Row>
              </Container>
            </Tab>
            <Tab eventKey="duplicate" title="Duplicate check">
              <Container className="mt-2">
                <Row>
                  <Col>
                    <Form>
                      <Form.Group controlId="exampleForm.ControlTextarea1">
                        <Form.Control placeholder="Orders list" as="textarea" rows="10" onChange={this.duplicateCheck}/>
                      </Form.Group>
                    </Form>
                  </Col>
                </Row>
                <Row>
                  <Duplicate isDuplicate={this.state.isDuplicate} duplicateValues={this.state.duplicateValues}/>
                </Row>
              </Container>
            </Tab>
          </Tabs>;
        </div>
    );
  }
}

export default App;
