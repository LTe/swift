import React, {useState} from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import 'moment/locale/pl';
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import {AccountDetails, Block4, findTypes, getAccountNumberFromFin, parse, ParsedSwift, useAccountInput} from './utils'
import moment from 'moment';
import JSONPretty from 'react-json-pretty'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula, solarizedlight} from 'react-syntax-highlighter/dist/esm/styles/prism';

interface GeneratorState {
  templates: ParsedSwift[];
  orders: ParsedSwift[];
  transactions: string[];
  rawTemplates: string[];
  rawOrders: string[];
}

function Generator(): JSX.Element {
  const [state, setState] = useState<GeneratorState>({
      templates: [],
      orders: [],
      transactions: [],
      rawTemplates: [],
      rawOrders: []
    }
  )

  const accounts = useAccountInput([])

  function onOrderChange(event: React.FormEvent<HTMLInputElement>): void {
    const target = event.target as HTMLInputElement
    const orders = (target.value || '').replace(/ :/g, "\n:").split(/\n{2,}/)
    setState({...state, orders: orders.map(parse), rawOrders: orders})
  }

  function onTemplateChange(event: React.FormEvent<HTMLInputElement>): void {
    const target = event.target as HTMLInputElement
    const templates = (target.value || '').split(/\n{2,}/)
    setState({...state, templates: templates.map(parse), rawTemplates: templates})
  }

  function generateTradeDate(date: Block4): Block4 {
    const orderValueDate = moment(date.ast.Date, "YYYYMMDD")

    if (!moment().isAfter(orderValueDate)) {
      date.ast.Date = moment().format('YYYYMMDD')
    }

    return date
  }

  function generateTransaction(swift: ParsedSwift): string {
    try {
      const accountNumber = findTypes(swift, '97', 'A', 'SAFE')[0].ast['Account Number'] || ''
      const matchingAccount = accounts.value.find((mapping: AccountDetails) => { return accountNumber.includes(mapping.account) })

      if (!matchingAccount) { return 'There was a problem with matching accounts' }

      const matchingTemplateIndex = state.templates.findIndex((template: ParsedSwift) => {
        const fundAccount = findTypes(template, '83', 'J')[0]
        const nostoAccount = findTypes(template, '58', 'J')[0]
        if (!fundAccount && !nostoAccount) { return false }

        const fundAccountNumber = getAccountNumberFromFin(fundAccount.ast)
        const nostoAccountNumber = getAccountNumberFromFin(nostoAccount.ast)

        return !!(fundAccountNumber === matchingAccount.fund && nostoAccountNumber === matchingAccount.nostro);
      })

      const matchingTemplate = state.templates[matchingTemplateIndex]

      if (!matchingTemplate) { return 'There was a problem with generating transaction' }

      const valueDate = findTypes(swift,'98', 'A', 'VALU')[0]
      const tradeDate = generateTradeDate(valueDate)
      const sellAmount = findTypes(swift, '19', 'B', 'NETT')[0]
      const buyAmount = findTypes(swift, '19', 'B', 'PSTA')[0]
      const rate = findTypes(swift, '92', 'B', 'EXCH')[0]

      let transaction = state.rawTemplates[matchingTemplateIndex].slice()

      transaction = transaction.replace(/30V:.*\n/, '30V:' + valueDate.ast.Date + "\n")
      transaction = transaction.replace(/30T:.*\n/, '30T:' + tradeDate.ast.Date + "\n")
      transaction = transaction.replace(/33B:.*\n/, '33B:' + sellAmount.ast['Currency Code'] + sellAmount.ast.Amount + "\n")
      transaction = transaction.replace(/32B:.*\n/, '32B:' + buyAmount.ast['Currency Code'] + buyAmount.ast.Amount + "\n")
      transaction = transaction.replace(/36:.*\n/, '36:' + rate.ast.Rate + "\n")

      return transaction

    } catch (e) {
      return 'There was internal problem with transaction generation'
    }
  }

  function renderGeneratedTransactions(): JSX.Element[] {
    const generateTransactions = state.orders.map(generateTransaction)

    return state.rawOrders.map((order: string, index: number) => {
      return (
        <Row key={index}>
          <Col>
            <SyntaxHighlighter className="copiedOrder" language='javascript' style={solarizedlight}>{order}</SyntaxHighlighter>
          </Col>
          <Col>
            <SyntaxHighlighter className="generatedTransaction" language='javascript' style={darcula}>{generateTransactions[index]}</SyntaxHighlighter>
          </Col>
        </Row>
      )
    })
  }

  return (
    <Container className="my-2">
      <Row>
        <Col>
          <Form>
            <Form.Group>
              <Form.Control placeholder="Orders" as="textarea" rows="5" onChange={onOrderChange}/>
            </Form.Group>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form>
            <Form.Group>
              <Form.Control placeholder="Accounts" as="textarea" rows="5" onChange={accounts.handleChange}/>
            </Form.Group>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form>
            <Form.Group>
              <Form.Control placeholder="Templates" as="textarea" rows="5" onChange={onTemplateChange}/>
            </Form.Group>
          </Form>
        </Col>
      </Row>
      {renderGeneratedTransactions()}
      <Row>
        <h4>Transactions</h4>
      </Row>
      <Row>
        <Col>
          <JSONPretty data={state.transactions}/>
        </Col>
      </Row>
      <Row>
        <h4>Orders</h4>
      </Row>
      <Row>
        <Col>
          <JSONPretty data={state.orders}/>
        </Col>
      </Row>
      <Row>
        <h4>Templates</h4>
      </Row>
      <Row>
        <Col>
          <JSONPretty data={state.templates}/>
        </Col>
      </Row>
      <Row>
        <h4>Accounts</h4>
      </Row>
      <Row>
        <Col>
          <JSONPretty data={accounts}/>
        </Col>
      </Row>
    </Container>
  )
}

export default Generator;
