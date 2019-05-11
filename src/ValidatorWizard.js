import React, { Component } from 'react';
import 'moment/locale/pl';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Validator from "./Validator";
import './App.css';
import ListGroup from "react-bootstrap/ListGroup";
import Details from './Details'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula, solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {parse, findType, renderCurrency, onAccountChange} from './utils'
import JSONPretty from 'react-json-pretty'

class ValidatorWizard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orders: [],
      ordersRaw: [],
      currentOrderRaw: "",
      currentOrder: {},
      orderRaw: "",
      accounts: [],
      transactionJSON: {},
      transactions: {},
      transactionRaw: "",
      orderJSON: {},
      currentOrderIndex: 0,
      validOrders: [],
      invalidOrders: [],
    }

    this.onOrdersChange = this.onOrdersChange.bind(this)
    this.onTransactionChange = this.onTransactionChange.bind(this)
    this.generateWizard = this.generateWizard.bind(this)
    this.clearWizard = this.clearWizard.bind(this)
    this.onOrderClick = this.onOrderClick.bind(this)
    this.markAsValid = this.markAsValid.bind(this)
    this.markAsInvalid = this.markAsInvalid.bind(this)
    this.onAccountChange = onAccountChange.bind(this)
  }

  render() {
    if(this.state.orders.length === 0) {
      return this.renderInputPage()
    } else {
      return this.renderWizard()
    }
  }

  renderInputPage() {
    return (
      <Col className="m-1">
        <Row>
          <Col>
            <Form>
              <Form.Group>
                <Form.Control className="m-1" placeholder="Orders" as="textarea" rows="10" onChange={this.onOrdersChange}/>
                <Form.Control className="m-1" placeholder="Accounts" as="textarea" rows="10" onChange={this.onAccountChange}/>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row className="m-1">
          <Button variant="primary" onClick={this.generateWizard}>Generate</Button>
        </Row>
        <Row className="m-1">
          <Col>
            <JSONPretty data={this.state.accounts}/>
          </Col>
        </Row>
      </Col>
    )
  }

  renderList() {
    return this.state.orders.map((order, index) => {
      try {
        const buy = findType(order, "19", "B", "NETT")[0].ast
        const sell = findType(order, "19", "B", "PSTA")[0].ast
        const active = index === this.state.currentOrderIndex
        let variant

        if (this.state.validOrders.includes(index) && !this.state.invalidOrders.includes(index)) {
          variant = "success"
        } else if (this.state.invalidOrders.includes(index)) {
          variant = "danger"
        }

        return (
          <ListGroup.Item as="li" key={index} variant={variant} active={active} action onClick={this.onOrderClick(index)}>
            <Row>
              <Col>
                {renderCurrency(sell['Amount'], sell['Currency Code'])} / {renderCurrency(buy['Amount'], buy['Currency Code'])}
              </Col>
              <Col xs={2}>
                <Button variant="success" onClick={this.markAsValid(index)}><span aria-label="Valid" role="img">👍</span></Button>
              </Col>
              <Col xs={2}>
                <Button variant="danger" onClick={this.markAsInvalid(index)}><span aria-label="Invalid" role="img">👎</span></Button>
              </Col>
            </Row>
          </ListGroup.Item>
        )
      } catch (e) {
       return (
         <ListGroup.Item as="li" key={index} variant="dark" action onClick={this.onOrderClick(index)}>
           <Row>
             <Col>
               Problem with parse
             </Col>
           </Row>
         </ListGroup.Item>
       )
      }
    })
  }

  renderWizard() {
    return (
      <Row className="mt-1 ml-1 mr-1" >
        <Col xs={4}>
          <Col className="m-1">
            <Button variant="danger" onClick={this.clearWizard}>Clear</Button>
          </Col>
          <Col>
            <ListGroup as="ul">
              {this.renderList()}
            </ListGroup>
          </Col>
        </Col>
        <Col className="mr-1">
          <Row>
            <Col>
              <Form>
                <Form.Group>
                  <Form.Control placeholder="Transaction" as="textarea" rows="10" value={this.state.transactionRaw} onChange={this.onTransactionChange}/>
                </Form.Group>
              </Form>
            </Col>
          </Row>
          <Row>
            <Col>
              <Validator orderJSON={this.state.currentOrder} transactionJSON={this.state.transactionJSON} accounts={this.state.accounts}/>
            </Col>
          </Row>
          <Row>
            <Col>
             <hr/>
            </Col>
          </Row>
          <Row>
            <Col xs={6}>
              <Details parsedSwift={this.state.currentOrder}></Details>
            </Col>
            <Col xs={6}>
              <Details parsedSwift={this.state.transactionJSON}></Details>
            </Col>
          </Row>
          <Row>
            <Col>
              <SyntaxHighlighter language='javascript' style={solarizedlight}>{this.state.currentOrderRaw}</SyntaxHighlighter>
            </Col>
            <Col>
              <SyntaxHighlighter language='javascript' style={darcula}>{this.state.transactionRaw}</SyntaxHighlighter>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }

  onTransactionChange(event) {
    const value = event.target.value
    const transactions = this.state.transactions
    transactions[this.state.currentOrderIndex] = value

    this.setState({transactionJSON: parse(value), transactionRaw: value, transactions: transactions})
  }

  onOrdersChange(event) {
    const value = event.target.value
    this.setState({orderRaw: value})
  }

  generateWizard() {
    try {
      const orders = this.state.orderRaw.replace(/ :/g, "\n:").split(/\n{2,}/)
      this.setState({
        orders: orders.map(parse),
        ordersRaw: orders,
        currentOrderRaw: orders[0],
        currentOrder: parse(orders[0]),
      })
    } catch (e) {
      this.setState({orders: []})
    }
  }

  clearWizard() {
    this.setState({orders: []})
  }

  onOrderClick(orderIndex) {
    return (() => {
      return this.setState({
        currentOrderRaw: this.state.ordersRaw[orderIndex],
        currentOrder: this.state.orders[orderIndex],
        currentOrderIndex: orderIndex,
        transactionRaw: this.state.transactions[orderIndex] || "",
        transactionJSON: parse(this.state.transactions[orderIndex] || "")
      })
    })
  }

  markAsValid(orderIndex) {
    return (() => {
      const validOrders = this.state.validOrders
      const invalidOrders = this.state.invalidOrders.filter((order) => { return order !== orderIndex})
      validOrders.push(orderIndex)
      return this.setState({ validOrders: validOrders, invalidOrders: invalidOrders })
    })
  }

  markAsInvalid(orderIndex) {
    return (() => {
      const invalidOrders = this.state.invalidOrders
      const validOrders = this.state.validOrders.filter((order) => { return order !== orderIndex})
      invalidOrders.push(orderIndex)
      return this.setState({ invalidOrders: invalidOrders, validOrders: validOrders })
    })
  }
}

ValidatorWizard.defaultProps = {
  orderJSON: {},
  transactionJSON: {},
  accounts: []
}

export default ValidatorWizard;