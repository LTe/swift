import React, {Component} from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import JSONPretty from 'react-json-pretty'
import Details from './Details'
import './App.css'
import Validator from "./Validator"
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import Duplicate from "./Duplicate"
import {isEqual} from "underscore"
import Generator from "./Generator";
import {onAccountChange, parse} from './utils'
import ValidatorWizard from "./ValidatorWizard";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderJSON: {},
      transactionJSON: {},
      accounts: [],
      isDuplicate: false,
      duplicateValues: [],
      mappedSwifts: []
    }

    this.onOrderChange = this.onOrderChange.bind(this);
    this.onTransactionChange = this.onTransactionChange.bind(this);
    this.onAccountChange = onAccountChange.bind(this);
    this.duplicateCheck = this.duplicateCheck.bind(this);
  }

  duplicateCheck(event) {
    const swifts = event.target.value.split(/\n{2,}/)
    const mappedSwifts = swifts.map((swift) => {
      return parse(swift)
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
        duplicateValues: duplicatedOrders,
        mappedSwifts: mappedSwifts
      }
    )
  }

  onOrderChange(event) {
    const value = event.target.value
    this.setState({orderJSON: parse(value)})
  }

  onTransactionChange(event) {
    const value = event.target.value
    this.setState({transactionJSON: parse(value)})
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
                  <Duplicate isDuplicate={this.state.isDuplicate} mappedSwifts={this.state.mappedSwifts} duplicateValues={this.state.duplicateValues}/>
                </Row>
              </Container>
            </Tab>
            <Tab eventKey="generator" title="Order generator">
              <Generator/>
            </Tab>
            <Tab eventKey="validatorWizard" title="Validator wizard">
              <ValidatorWizard/>
            </Tab>
          </Tabs>
        </div>
    );
  }
}

export default App;
