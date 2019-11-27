import React, {useState} from 'react';
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
import {findType, parse, ParsedSwift, renderCurrency, useAccountInput} from './utils'
import JSONPretty from 'react-json-pretty'
import Badge from "react-bootstrap/Badge";

interface ValidatorWizardState {
  orders: ParsedSwift[];
  ordersRaw: string[];
  currentOrderRaw: string;
  currentOrder: ParsedSwift;
  orderRaw: string;
  transactionJSON: ParsedSwift;
  transactions: string[];
  transactionRaw: string;
  orderJSON: ParsedSwift;
  currentOrderIndex: number;
  refDate: string;
  number: number;
}

function ValidatorWizard(): JSX.Element {
  const [state, setState] = useState<ValidatorWizardState>({
    orders: [],
    ordersRaw: [],
    currentOrderRaw: "",
    currentOrder: {} as ParsedSwift,
    orderRaw: "",
    transactionJSON: {} as ParsedSwift,
    transactions: [],
    transactionRaw: "",
    orderJSON: {} as ParsedSwift,
    currentOrderIndex: 0,
    refDate: '',
    number: 0
  })

  const accounts = useAccountInput([])
  const [validOrders, setValidOrders] = useState<number[]>([])
  const [invalidOrders, setInvalidOrders] = useState<number[]>([])

  function onTransactionChange(event: React.FormEvent<HTMLInputElement>): void {
    const value = event.currentTarget.value || ''
    const transactions = state.transactions
    transactions[state.currentOrderIndex] = value

    setState({...state, transactionJSON: parse(value), transactionRaw: value, transactions: transactions})
  }

  function onOrdersChange(event: React.FormEvent<HTMLInputElement>): void {
    const value = (event.currentTarget.value || '')
    setState({...state, orderRaw: value})
  }

  function onRefChange(event: React.FormEvent<HTMLInputElement>): void {
    const value = event.currentTarget.value || ''

    const refDate = value.slice(0, 10)
    const number = parseFloat(value.slice(10))

    setState({
      ...state,
      refDate: refDate,
      number: number
    })
  }

  function generateWizard(): void {
    try {
      const orders = state.orderRaw.replace(/ :/g, "\n:").split(/\n{2,}/)
      setState({
        ...state,
        orders: orders.map(parse),
        ordersRaw: orders,
        currentOrderRaw: orders[0],
        currentOrder: parse(orders[0]),
      })
    } catch (e) {
      setState({...state, orders: []})
    }
  }

  function clearWizard(): void {
    setState({...state, orders: []})
  }

  function onOrderClick(orderIndex: number) {
    return ((): void => {
      return setState({
        ...state,
        currentOrderRaw: state.ordersRaw[orderIndex],
        currentOrder: state.orders[orderIndex],
        currentOrderIndex: orderIndex,
        transactionRaw: state.transactions[orderIndex] || "",
        transactionJSON: parse(state.transactions[orderIndex] || "")
      })
    })
  }

  function markAsValid (orderIndex: number) {
    return ((): void => {
      const newInvalidOrders = invalidOrders.filter((order: number) => {return order !== orderIndex})
      validOrders.push(orderIndex)

      setInvalidOrders(newInvalidOrders)
      setValidOrders(validOrders)
    })
  }

  function markAsInvalid(orderIndex: number) {
    return ((): void => {
      const newInvalidOrders = invalidOrders
      const newValidOrders = validOrders.filter((order: number) => { return order !== orderIndex})
      newInvalidOrders.push(orderIndex)

      setValidOrders(newValidOrders)
      setInvalidOrders(newInvalidOrders)
    })
  }

  function renderInputPage(): JSX.Element {
    return (
      <Col className="m-1">
        <Row>
          <Col>
            <Form>
              <Form.Group>
                <Form.Control className="m-1" placeholder="Orders" as="textarea" rows="10" onChange={onOrdersChange}/>
                <Form.Control className="m-1" placeholder="First Reference" as="input" onChange={onRefChange}/>
                <Form.Control className="m-1" placeholder="Accounts" as="textarea" rows="10" onChange={accounts.handleChange}/>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row className="m-1">
          <Button variant="primary" onClick={generateWizard}>Generate</Button>
        </Row>
        <Row className="m-1">
          <Col>
            <JSONPretty data={accounts.value}/>
          </Col>
        </Row>
      </Col>
    )
  }

  function renderList(): JSX.Element[] {
    return state.orders.map((order: ParsedSwift, index: number) => {
      const buy = findType(order, "19", "B", "NETT")
      const sell = findType(order, "19", "B", "PSTA")
      let buyAST, sellAST, active
      let variant: "success" | "danger" | undefined

      if (buy && sell) {
        buyAST = buy.ast
        sellAST = sell.ast
        active = index === state.currentOrderIndex

        if (validOrders.includes(index) && invalidOrders.includes(index)) {
          variant = "success"
        } else if (invalidOrders.includes(index)) {
          variant = "danger"
        } else {
          variant = undefined
        }
      } else {
        return (
          <ListGroup.Item as="li" key={index} variant="dark" action onClick={onOrderClick(index)}>
            <Row>
              <Col>
                Problem with parse
              </Col>
            </Row>
          </ListGroup.Item>
        )
      }

      return (
        <ListGroup.Item as="li" key={index} variant={variant} active={active} action onClick={onOrderClick(index)}>
          <Row>
            <Col>
              <Badge pill variant="light"> {state.refDate}<strong>{state.number + index + 1}</strong> </Badge>
            </Col>
            <Col>
              {renderCurrency(sellAST['Amount'], sellAST['Currency Code'])} / {renderCurrency(buyAST['Amount'], buyAST['Currency Code'])}
            </Col>
            <Col xs={2}>
              <Button variant="success" onClick={markAsValid(index)}><span aria-label="Valid" role="img">👍</span></Button>
            </Col>
            <Col xs={2}>
              <Button variant="danger" onClick={markAsInvalid(index)}><span aria-label="Invalid" role="img">👎</span></Button>
            </Col>
          </Row>
        </ListGroup.Item>
      )
    })
  }
  function renderWizard(): JSX.Element {
    return (
      <Row className="mt-1 ml-1 mr-1" >
        <Col xs={4}>
          <Col className="m-1">
            <Button variant="danger" onClick={clearWizard}>Clear</Button>
          </Col>
          <Col>
            <ListGroup as="ul">
              {renderList()}
            </ListGroup>
          </Col>
        </Col>
        <Col xs={7} className="mr-1">
          <Row>
            <Col>
              <Form>
                <Form.Group>
                  <Form.Control placeholder="Transaction" as="textarea" rows="10" value={state.transactionRaw} onChange={onTransactionChange}/>
                </Form.Group>
              </Form>
            </Col>
          </Row>
          <Row>
            <Col>
              <Validator orderJSON={state.currentOrder} transactionJSON={state.transactionJSON} accounts={accounts.value}/>
            </Col>
          </Row>
          <Row>
            <Col>
              <hr/>
            </Col>
          </Row>
          <Row>
            <Col xs={6}>
              <Details parsedSwift={state.currentOrder}/>
            </Col>
            <Col xs={6}>
              <Details parsedSwift={state.transactionJSON}/>
            </Col>
          </Row>
          <Row>
            <Col>
              <SyntaxHighlighter language='javascript' style={solarizedlight}>{state.currentOrderRaw}</SyntaxHighlighter>
            </Col>
            <Col>
              <SyntaxHighlighter language='javascript' style={darcula}>{state.transactionRaw}</SyntaxHighlighter>
            </Col>
          </Row>
          <Row>
            <Col>
              <SyntaxHighlighter language='javascript' style={duotoneDark}>{state.currentOrder.toString()}</SyntaxHighlighter>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }

  if(state.orders.length === 0) {
    return renderInputPage()
  } else {
    return renderWizard()
  }
}

export default ValidatorWizard;
