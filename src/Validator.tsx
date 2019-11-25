import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Badge from 'react-bootstrap/Badge';
import moment, {Moment} from 'moment';
import 'moment/locale/pl';
import {AccountDetails, Block4, findType, findTypes, getAccountNumberFromFin, ParsedSwift, SwiftAST} from './utils'

import './assets/css/App.css';

interface ValidatorProps {
  orderJSON: ParsedSwift
  transactionJSON: ParsedSwift
  accounts: AccountDetails[]
}

function Validator(props: ValidatorProps): JSX.Element {

  function validateAccount(account: Block4, orderAccount: Block4, label: string) : JSX.Element {
    let accountNumber = getAccountNumberFromFin(account.ast)
    let orderAccountNumber = orderAccount.ast['Account Number'] || 'Unknown account'

    let matchingAccount = props.accounts.find((mapping: AccountDetails) => {
      return orderAccountNumber.includes(mapping.account)
    }) || {fund: 'Unknown number'}

    let validation = matchingAccount.fund === accountNumber

    return renderType(label, orderAccountNumber, matchingAccount.fund, validation)
  }

  function validateFundAccount() : JSX.Element | null {
    let orderAccount = findType(props.orderJSON, '97', 'A', 'SAFE')
    let fundAccount = findType(props.transactionJSON, '83', 'J')

    if (orderAccount && fundAccount) {
      return validateAccount(fundAccount, orderAccount, 'Fund Account Number')
    } else {
      return null
    }
  }

  function validateNostroAccount(): JSX.Element | null {
    let orderAccount = findTypes(props.orderJSON, '97', 'A', 'SAFE')[0]
    let nostroAccount = findTypes(props.transactionJSON, '58', 'J')[0]

    if (orderAccount && nostroAccount) {
      return validateAccount(nostroAccount, nostroAccount, 'Fund Account Number')
    } else {
      return null
    }
  }

  function validateRate() : JSX.Element | undefined {
    let orderRateRaw = findType(props.orderJSON, '92', 'B', 'EXCH')
    let rateRaw = findType(props.transactionJSON, '36')
    let buyRaw = findType(props.transactionJSON, '32', 'B')
    let sellRaw = findType(props.transactionJSON, '33', 'B')

    if(!rateRaw || !buyRaw || !sellRaw || !orderRateRaw) { return }

    let buy = (buyRaw.ast['Amount'] || 0) as number
    let sell = (sellRaw.ast['Amount'] || 1) as number
    let rate = renderFloat(rateRaw.ast['Rate'] || '')
    let orderRate = renderFloat(orderRateRaw.ast['Rate'] || '')
    const computedRate = (buy / sell).toFixed(2)

    return renderType('Rate', orderRate, rate + ' (Calculated: ' + computedRate + ')', rate === orderRate)
  }

  function validateTradeDate() : JSX.Element | undefined {
    let orderValueRaw = findTypes(props.orderJSON, '98', 'A', 'VALU')[0]
    let transactionValueRaw = findTypes(props.transactionJSON, '30', 'T')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast
    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    let correctOrderValueDate = moment(orderValue['Date'], "YYYYMMDD")

    if(!moment().isAfter(orderValueDate)) { correctOrderValueDate = moment() }

    const validation = correctOrderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return renderType(
      'Trade Date',
      renderDate(orderValueDate),
      renderDate(correctOrderValueDate),
      validation)
  }

  function validateValueDate() : JSX.Element | undefined {
    let orderValueRaw = findTypes(props.orderJSON,'98', 'A', 'VALU')[0]
    let transactionValueRaw = findTypes(props.transactionJSON, '30', 'V')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast

    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    const validation = orderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return renderType('Value Date', renderDate(orderValueDate), renderDate(moment(transactionValue['Date'], 'YYYYMMDD')), validation)
  }

  function validatePstaAmount() : JSX.Element | undefined {
    let orderValueRaw = findTypes(props.orderJSON,'19', 'B', 'PSTA')[0]
    let transactionValueRaw = findTypes(props.transactionJSON, '32', 'B')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast

    return renderAmountValidator(orderValue, transactionValue, 'Buy Currency Amount')
  }

  function validateNettAmount() : JSX.Element | undefined {
    let orderValueRaw = findTypes(props.orderJSON, '19', 'B', 'NETT')[0]
    let transactionValueRaw = findTypes(props.transactionJSON, '33', 'B')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast

    return renderAmountValidator(orderValue, transactionValue, 'Sell Currency Amount')
  }

  function renderAmountValidator(orderValue: SwiftAST, transactionValue: SwiftAST, label: string) : JSX.Element {
    const validation = renderFloat(orderValue['Amount']) === renderFloat(transactionValue['Amount']) && orderValue['Currency Code'] === transactionValue['Currency']
    return renderType(label, renderCurrency(orderValue), renderCurrency(transactionValue), validation)
  }

  function renderCurrency(ast: SwiftAST) {
    return renderFloat((ast['Amount'] || '') + " " + (ast['Currency'] || ast['Currency Code']))
  }

  function renderFloat(floatSting?: string, precision = 2) {
    return parseFloat((floatSting || '').replace(',', '.')).toFixed(precision)
  }

  function renderDate(date: Moment) {
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  }

  function renderType(label: string, valueLeft: string, valueRight: string, valid: boolean) : JSX.Element {
    const badgeVariant = valid ? 'success' : 'danger'

    return (
      <React.Fragment>
        <Col className="justify-content-center" xs={4}>{valueLeft}</Col>
        <Col className="justify-content-center" xs={4}>
          <Badge variant={badgeVariant}>{label}</Badge>
        </Col>
        <Col className="justify-content-center" xs={4}>{valueRight}</Col>
      </React.Fragment>
    )
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
