import React, {Component} from 'react';
import 'moment/locale/pl';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Validator from "./Validator";
import './assets/css/App.css';
import ListGroup from "react-bootstrap/ListGroup";
import Details from './Details'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula, duotoneDark, solarizedlight} from 'react-syntax-highlighter/dist/esm/styles/prism';
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {AccountDetails, findTypes, onAccountChange, parse, ParsedSwift, renderCurrency} from './utils'
import JSONPretty from 'react-json-pretty'
import Badge from "react-bootstrap/Badge";

interface ValidatorWizardProps {
  orderJSON: ParsedSwift
  transactionJSON: ParsedSwift
  accounts: AccountDetails[]
}

interface ValidatorWizardState {
  orders: ParsedSwift[]
  ordersRaw: string[]
  currentOrderRaw: string
  currentOrder: ParsedSwift
  orderRaw: string
  accounts: AccountDetails[]
  transactionJSON: ParsedSwift
  transactions: string[]
  transactionRaw: string
  orderJSON: ParsedSwift
  currentOrderIndex: number
  validOrders: number[]
  invalidOrders: number[]
  refDate: string
  number: number
}

class ValidatorWizard extends Component<ValidatorWizardProps, ValidatorWizardState> {
  private readonly onAccountChange: OmitThisParameter<(this: React.Component, event: any) => void>;

  static defaultProps = {
    orderJSON: {},
    transactionJSON: {},
    accounts: []
  }

  constructor(props: any) {
    super(props)

    this.state = {
      orders: [],
      ordersRaw: [],
      currentOrderRaw: "",
      currentOrder: {} as ParsedSwift,
      orderRaw: "",
      accounts: [],
      transactionJSON: {} as ParsedSwift,
      transactions: [],
      transactionRaw: "",
      orderJSON: {} as ParsedSwift,
      currentOrderIndex: 0,
      validOrders: [],
      invalidOrders: [],
      refDate: '',
      number: 0
    }

    this.onAccountChange = onAccountChange.bind(this)
  }

  render() {
    if(this.state.orders.length === 0) {
      return this.renderInputPage()
    } else {
      return this.renderWizard()
    }
  }

  renderInputPage() : JSX.Element {
    return (
      <Col className="m-1">
        <Row>
          <Col>
            <Form>
              <Form.Group>
                <Form.Control className="m-1" placeholder="Orders" as="textarea" rows="10" onChange={this.onOrdersChange}/>
                <Form.Control className="m-1" placeholder="First Reference" as="input" onChange={this.onRefChange}/>
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

  renderList() : JSX.Element[] {
    return this.state.orders.map((order: ParsedSwift, index: number) => {
      try {
        const buy = findTypes(order, "19", "B", "NETT")[0].ast
        const sell = findTypes(order, "19", "B", "PSTA")[0].ast
        const active = index === this.state.currentOrderIndex
        let variant : "success" | "danger" | undefined

        if (this.state.validOrders.includes(index) && !this.state.invalidOrders.includes(index)) {
          variant = "success"
        } else if (this.state.invalidOrders.includes(index)) {
          variant = "danger"
        } else {
          variant = undefined
        }

        return (
          <ListGroup.Item as="li" key={index} variant={variant} active={active} action onClick={this.onOrderClick(index)}>
            <Row>
              <Col>
                <Badge pill variant="light"> {this.state.refDate}<strong>{this.state.number + index + 1}</strong> </Badge>
              </Col>
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
               Problem with parse <strong>{e.message}</strong>
             </Col>
           </Row>
         </ListGroup.Item>
       )
      }
    })
  }

  renderWizard() : JSX.Element {
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
        <Col xs={7} className="mr-1">
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
          <Row>
            <Col>
              <SyntaxHighlighter language='javascript' style={duotoneDark}>{this.state.currentOrder.toString()}</SyntaxHighlighter>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }

  onTransactionChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value || ''
    const transactions = this.state.transactions
    transactions[this.state.currentOrderIndex] = value

    this.setState({transactionJSON: parse(value), transactionRaw: value, transactions: transactions})
  }

  onOrdersChange = (event : React.FormEvent<HTMLInputElement>) => {
    const value = (event.currentTarget.value || '')
    this.setState({orderRaw: value})
  }

  generateWizard = () => {
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

  clearWizard = () => {
    this.setState({orders: []})
  }

  onOrderClick = (orderIndex: number) => {
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

  markAsValid = (orderIndex: number) => {
    return (() => {
      const validOrders = this.state.validOrders
      const invalidOrders = this.state.invalidOrders.filter((order: any) => { return order !== orderIndex})
      validOrders.push(orderIndex)
      return this.setState({ validOrders: validOrders, invalidOrders: invalidOrders })
    })
  }

  markAsInvalid = (orderIndex: number) => {
    return (() => {
      const invalidOrders = this.state.invalidOrders
      const validOrders = this.state.validOrders.filter((order: any) => { return order !== orderIndex})
      invalidOrders.push(orderIndex)
      return this.setState({ invalidOrders: invalidOrders, validOrders: validOrders })
    })
  }

  onRefChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value || ''

    const refDate = value.slice(0, 10)
    const number = parseFloat(value.slice(10))

    this.setState({
      refDate: refDate,
      number: number
    })
  }
}

export default ValidatorWizard;
