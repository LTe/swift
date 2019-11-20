import React, {Component} from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import 'moment/locale/pl';
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import {AccountDetails, Block4, findType, getAccountNumberFromFin, onAccountChange, parse, ParsedSwift} from './utils'
import moment from 'moment';
import JSONPretty from 'react-json-pretty'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula, solarizedlight} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {FormControlProps} from "react-bootstrap";

interface GeneratorProps {}

interface GeneratorState {
  accounts: AccountDetails[]
  templates: ParsedSwift[]
  orders: ParsedSwift[]
  transactions: string[]
  rawTemplates: string[]
  rawOrders: string[]
}

class Generator extends Component<GeneratorProps, GeneratorState> {
  private readonly onAccountChange: any;

  constructor(props: any) {
    super(props)

    this.state = {
      accounts: [],
      templates: [],
      orders: [],
      transactions: [],
      rawTemplates: [],
      rawOrders: []
    }

    this.onOrderChange = this.onOrderChange.bind(this)
    this.onTemplateChange = this.onTemplateChange.bind(this)
    this.onAccountChange = onAccountChange.bind(this)
    this.generateTransaction = this.generateTransaction.bind(this)
  }
  onOrderChange (event: React.ChangeEvent<FormControlProps>) : void {
    const orders = (event.target.value || '').replace(/ :/g, "\n:").split(/\n{2,}/)
    this.setState({orders: orders.map(parse), rawOrders: orders})
  }

  onTemplateChange (event: React.ChangeEvent<FormControlProps>) : void {
    const templates =  (event.target.value || '').split(/\n{2,}/)
    this.setState({templates: templates.map(parse), rawTemplates: templates})
  }

  generateTransaction(swift: ParsedSwift) {
    try {
      const accountNumber = findType(swift, '97', 'A', 'SAFE')[0].ast['Account Number'] || ''
      const matchingAccount = this.state.accounts.find((mapping: AccountDetails) => { return accountNumber.includes(mapping.account) })

      if (!matchingAccount) { return 'There was a problem with matching accounts' }

      const matchingTemplateIndex = this.state.templates.findIndex((template: ParsedSwift, index: any) => {
        const fundAccount = findType(template, '83', 'J')[0]
        const nostoAccount = findType(template, '58', 'J')[0]
        if (!fundAccount && !nostoAccount) { return false }

        const fundAccountNumber = getAccountNumberFromFin(fundAccount.ast)
        const nostoAccountNumber = getAccountNumberFromFin(nostoAccount.ast)

        if (fundAccountNumber === matchingAccount.fund && nostoAccountNumber === matchingAccount.nostro) {
          return true
        } else {
          return false
        }
      })

      const matchingTemplate = this.state.templates[matchingTemplateIndex]

      if (!matchingTemplate) { return 'There was a problem with generating transaction' }

      const valueDate = findType(swift,'98', 'A', 'VALU')[0]
      const tradeDate = this.generateTradeDate(valueDate)
      const sellAmount = findType(swift, '19', 'B', 'NETT')[0]
      const buyAmount = findType(swift, '19', 'B', 'PSTA')[0]
      const rate = findType(swift, '92', 'B', 'EXCH')[0]

      let transaction = this.state.rawTemplates[matchingTemplateIndex].slice()

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

  generateTradeDate(date: Block4) : Block4 {
    const orderValueDate = moment(date.ast.Date, "YYYYMMDD")

    if (!moment().isAfter(orderValueDate)) {
      date.ast.Date = moment().format('YYYYMMDD')
    }

    return date
  }

  renderGeneratedTransactions() : JSX.Element[] {
    const generateTransactions = this.state.orders.map(this.generateTransaction)

    return this.state.rawOrders.map((order: any, index: any) => {
      return (
        <Row>
          <Col>
            <SyntaxHighlighter language='javascript' style={solarizedlight}>{order}</SyntaxHighlighter>
          </Col>
          <Col>
            <SyntaxHighlighter language='javascript' style={darcula}>{generateTransactions[index]}</SyntaxHighlighter>
          </Col>
        </Row>
      )
    })
  }

  render() {
    return (
      <Container className="my-2">
        <Row>
          <Col>
            <Form>
              <Form.Group>
                <Form.Control placeholder="Orders" as="textarea" rows="5" onChange={this.onOrderChange}/>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form>
              <Form.Group>
                <Form.Control placeholder="Accounts" as="textarea" rows="5" onChange={this.onAccountChange}/>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form>
              <Form.Group>
                <Form.Control placeholder="Templates" as="textarea" rows="5" onChange={this.onTemplateChange}/>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        {this.renderGeneratedTransactions()}
        <Row>
          <h4>Transactions</h4>
        </Row>
        <Row>
          <Col>
            <JSONPretty data={this.state.transactions}/>
          </Col>
        </Row>
        <Row>
          <h4>Orders</h4>
        </Row>
        <Row>
          <Col>
            <JSONPretty data={this.state.orders}/>
          </Col>
        </Row>
        <Row>
          <h4>Templates</h4>
        </Row>
        <Row>
          <Col>
            <JSONPretty data={this.state.templates}/>
          </Col>
        </Row>
        <Row>
          <h4>Accounts</h4>
        </Row>
        <Row>
          <Col>
            <JSONPretty data={this.state.accounts}/>
          </Col>
        </Row>
      </Container>
    )
  }
}

export default Generator;
