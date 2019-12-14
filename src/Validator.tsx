import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import Badge from 'react-bootstrap/Badge';
import moment, {Moment} from 'moment';
import 'moment/locale/pl';
import {AccountDetails, Block4, findType, getAccountNumberFromFin, ParsedSwift, SwiftAST} from './utils'

import './assets/css/App.css';

interface ValidatorProps {
  orderJSON: ParsedSwift;
  transactionJSON: ParsedSwift;
  accounts: AccountDetails[];
}

function Validator(props: ValidatorProps): JSX.Element {

  function renderType(label: string, valueLeft: string, valueRight: string, valid: boolean): JSX.Element {
    const badgeVariant = valid ? 'success' : 'danger'

    return (
      <Container>
        <Row data-label={label}>
          <Col className="order" xs={4}>{valueLeft}</Col>
          <Col xs={4}>
            <Badge variant={badgeVariant}>{label}</Badge>
          </Col>
          <Col className="transaction" xs={4}>{valueRight}</Col>
        </Row>
      </Container>
    )
  }

  function renderFloat(floatSting?: string, precision = 2): string {
    return parseFloat((floatSting || '').replace(',', '.')).toFixed(precision)
  }

  function renderCurrency(ast: SwiftAST): string {
    return renderFloat((ast['Amount'] || '') + " " + (ast['Currency'] || ast['Currency Code']))
  }

  function renderDate(date: Moment): string {
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  }

  function renderAmountValidator(orderValue: SwiftAST, transactionValue: SwiftAST, label: string): JSX.Element {
    const validation = renderFloat(orderValue['Amount']) === renderFloat(transactionValue['Amount']) && orderValue['Currency Code'] === transactionValue['Currency']
    return renderType(label, renderCurrency(orderValue), renderCurrency(transactionValue), validation)
  }

  function validateAccount(account: Block4, orderAccount: Block4, matchType: 'nostro' | 'fund', label: string): JSX.Element {
    const accountNumber = getAccountNumberFromFin(account.ast)
    const orderAccountNumber = orderAccount.ast['Account Number'] || 'Unknown account'

    const matchingAccount: AccountDetails = props.accounts.find((mapping: AccountDetails) => {
      return orderAccountNumber.includes(mapping.account)
    }) || {account: 'Unknown number', fund: 'Unknown number', nostro: 'Unknown number'}

    const validation: boolean = matchingAccount[matchType] === accountNumber

    return renderType(label, orderAccountNumber, matchingAccount[matchType], validation)
  }

  function validateFundAccount(): JSX.Element | null {
    const orderAccount = findType(props.orderJSON, '97', 'A', 'SAFE')
    const fundAccount = findType(props.transactionJSON, '83', 'J')

    if (orderAccount && fundAccount) {
      return validateAccount(fundAccount, orderAccount, 'fund', 'Fund Account Number')
    } else {
      return null
    }
  }

  function validateNostroAccount(): JSX.Element | null {
    const orderAccount = findType(props.orderJSON, '97', 'A', 'SAFE')
    const nostroAccount = findType(props.transactionJSON, '58', 'J')

    if (orderAccount && nostroAccount) {
      return validateAccount(nostroAccount, orderAccount, 'nostro', 'Nostro Account Number')
    } else {
      return null
    }
  }

  function validateRate(): JSX.Element | undefined {
    const orderRateRaw = findType(props.orderJSON, '92', 'B', 'EXCH')
    const rateRaw = findType(props.transactionJSON, '36')
    const buyRaw = findType(props.transactionJSON, '32', 'B')
    const sellRaw = findType(props.transactionJSON, '33', 'B')

    if(!rateRaw || !buyRaw || !sellRaw || !orderRateRaw) { return }

    const buy = parseFloat(buyRaw.ast['Amount'] || '0') as number
    const sell = parseFloat(sellRaw.ast['Amount'] || '1') as number
    const rate = renderFloat(rateRaw.ast['Rate'] || '')
    const orderRate = renderFloat(orderRateRaw.ast['Rate'] || '')
    const computedRate = (buy / sell).toFixed(2)

    return renderType('Rate', orderRate, rate + ' (Calculated: ' + computedRate + ')', rate === orderRate)
  }

  function validateTradeDate(): JSX.Element | undefined {
    const orderValueRaw = findType(props.orderJSON, '98', 'A', 'VALU')
    const transactionValueRaw = findType(props.transactionJSON, '30', 'T')

    if(!orderValueRaw || !transactionValueRaw) { return }

    const orderValue = orderValueRaw.ast
    const transactionValue = transactionValueRaw.ast
    const orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    let correctOrderValueDate = moment(orderValue['Date'], "YYYYMMDD")

    if(!moment().isAfter(orderValueDate)) { correctOrderValueDate = moment() }

    const validation = correctOrderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return renderType(
      'Trade Date',
      renderDate(orderValueDate),
      renderDate(correctOrderValueDate),
      validation)
  }

  function validateValueDate(): JSX.Element | undefined {
    const orderValueRaw = findType(props.orderJSON,'98', 'A', 'VALU')
    const transactionValueRaw = findType(props.transactionJSON, '30', 'V')

    if(!orderValueRaw || !transactionValueRaw) { return }

    const orderValue = orderValueRaw.ast
    const transactionValue = transactionValueRaw.ast

    const orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    const validation = orderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return renderType('Value Date', renderDate(orderValueDate), renderDate(moment(transactionValue['Date'], 'YYYYMMDD')), validation)
  }

  function validatePstaAmount(): JSX.Element | undefined {
    const orderValueRaw = findType(props.orderJSON,'19', 'B', 'PSTA')
    const transactionValueRaw = findType(props.transactionJSON, '32', 'B')

    if(!orderValueRaw || !transactionValueRaw) { return }

    const orderValue = orderValueRaw.ast
    const transactionValue = transactionValueRaw.ast

    return renderAmountValidator(orderValue, transactionValue, 'Buy Currency Amount')
  }

  function validateNettAmount(): JSX.Element | undefined {
    const orderValueRaw = findType(props.orderJSON, '19', 'B', 'NETT')
    const transactionValueRaw = findType(props.transactionJSON, '33', 'B')

    if(!orderValueRaw || !transactionValueRaw) { return }

    const orderValue = orderValueRaw.ast
    const transactionValue = transactionValueRaw.ast

    return renderAmountValidator(orderValue, transactionValue, 'Sell Currency Amount')
  }
  return (
    <React.Fragment>
      <Row className="center">
        <Col xs={4}><strong>What the order contains</strong></Col>
        <Col xs={4}>
          <Badge className="mr-sm-2" variant='success'>Valid</Badge>
          <Badge variant='danger'>Invalid</Badge>
        </Col>
        <Col xs={4}><strong>What it should be</strong></Col>
      </Row>
      <hr className="col-xs-12"/>
      <Row>
        {validateNettAmount()}
        {validatePstaAmount()}
        {validateValueDate()}
        {validateTradeDate()}
        {validateRate()}
        {validateFundAccount()}
        {validateNostroAccount()}
      </Row>
    </React.Fragment>
  )

}

export default Validator;
