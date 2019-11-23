import React, {Component} from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Badge from 'react-bootstrap/Badge';
import moment, {Moment} from 'moment';
import 'moment/locale/pl';
import {AccountDetails, findTypes, getAccountNumberFromFin, ParsedSwift, renderFloat, SwiftAST} from './utils'

import './assets/css/App.css';

interface ValidatorProps {
  orderJSON: ParsedSwift
  transactionJSON: ParsedSwift
  accounts: AccountDetails[]
}

interface ValidatorState {}

class Validator extends Component<ValidatorProps, ValidatorState> {
  render() {
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
          {this.validateNettAmount()}
          {this.validatePstaAmount()}
          {this.validateValueDate()}
          {this.validateTradeDate()}
          {this.validateRate()}
          {this.validateFundAccount()}
          {this.validateNostroAccount()}
        </Row>
      </React.Fragment>
    )
  }

  validateFundAccount() : JSX.Element | undefined {
    let orderAccount = findTypes(this.props.orderJSON, '97', 'A', 'SAFE')[0]
    let fundAccount = findTypes(this.props.transactionJSON, '83', 'J')[0]

    if(!orderAccount || !fundAccount) { return }

    let fundAccountNumber = getAccountNumberFromFin(fundAccount.ast)
    let orderAccountNumber = orderAccount.ast['Account Number'] || ''

    let matchingAccount = this.props.accounts.find((mapping: AccountDetails) => {
      return orderAccountNumber.includes(mapping.account)
    }) || {fund: 'Unknown number'}

    let validation = matchingAccount.fund === fundAccountNumber

    return Validator.renderType('Fund Account Number', orderAccountNumber, matchingAccount.fund, validation)
  }

  validateNostroAccount(): JSX.Element | undefined {
    let orderAccount = findTypes(this.props.orderJSON, '97', 'A', 'SAFE')[0]
    let nostroAccount = findTypes(this.props.transactionJSON, '58', 'J')[0]

    if(!orderAccount || !nostroAccount) { return }

    let nostroAccountNumber = getAccountNumberFromFin(nostroAccount.ast)
    let orderAccountNumber = orderAccount.ast['Account Number'] || ''

    let matchingAccount = this.props.accounts.find((mapping: AccountDetails) => {
      return orderAccountNumber.includes(mapping.account)
    }) || {nostro: 'Unknown number'}

    let validation = matchingAccount.nostro === nostroAccountNumber

    return Validator.renderType('Nostro Account Number', '', matchingAccount.nostro, validation)
  }

  validateRate() : JSX.Element | undefined {
    let orderRateRaw = findTypes(this.props.orderJSON, '92', 'B', 'EXCH')[0]
    let rateRaw = findTypes(this.props.transactionJSON, '36')[0]
    let buyRaw = findTypes(this.props.transactionJSON, '32', 'B')[0]
    let sellRaw = findTypes(this.props.transactionJSON, '33', 'B')[0]

    if(!rateRaw || !buyRaw || !sellRaw || !orderRateRaw) { return }

    let buy = (buyRaw.ast['Amount'] || 0) as number
    let sell = (sellRaw.ast['Amount'] || 1) as number
    let rate = renderFloat(rateRaw.ast['Rate'])
    let orderRate = renderFloat(orderRateRaw.ast['Rate'])
    const computedRate = (buy / sell).toFixed(2)

    return Validator.renderType('Rate', orderRate, rate + ' (Calculated: ' + computedRate + ')', rate === orderRate)
  }

  validateTradeDate() : JSX.Element | undefined {
    let orderValueRaw = findTypes(this.props.orderJSON, '98', 'A', 'VALU')[0]
    let transactionValueRaw = findTypes(this.props.transactionJSON, '30', 'T')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast
    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    let correctOrderValueDate = moment(orderValue['Date'], "YYYYMMDD")

    if(!moment().isAfter(orderValueDate)) { correctOrderValueDate = moment() }

    const validation = correctOrderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return Validator.renderType(
      'Trade Date',
      Validator.renderDate(orderValueDate),
      Validator.renderDate(correctOrderValueDate),
      validation)
  }

  validateValueDate() : JSX.Element | undefined {
    let orderValueRaw = findTypes(this.props.orderJSON,'98', 'A', 'VALU')[0]
    let transactionValueRaw = findTypes(this.props.transactionJSON, '30', 'V')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast

    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    const validation = orderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return Validator.renderType('Value Date', Validator.renderDate(orderValueDate), Validator.renderDate(moment(transactionValue['Date'], 'YYYYMMDD')), validation)
  }

  validatePstaAmount() : JSX.Element | undefined {
    let orderValueRaw = findTypes(this.props.orderJSON,'19', 'B', 'PSTA')[0]
    let transactionValueRaw = findTypes(this.props.transactionJSON, '32', 'B')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast

    return Validator.renderAmountValidator(orderValue, transactionValue, 'Buy Currency Amount')
  }

  validateNettAmount() : JSX.Element | undefined {
    let orderValueRaw = findTypes(this.props.orderJSON, '19', 'B', 'NETT')[0]
    let transactionValueRaw = findTypes(this.props.transactionJSON, '33', 'B')[0]

    if(!orderValueRaw || !transactionValueRaw) { return }

    let orderValue = orderValueRaw.ast
    let transactionValue = transactionValueRaw.ast

    return Validator.renderAmountValidator(orderValue, transactionValue, 'Sell Currency Amount')
  }

  static renderAmountValidator(orderValue: SwiftAST, transactionValue: SwiftAST, label: string) : JSX.Element {
    const validation = renderFloat(orderValue['Amount']) === renderFloat(transactionValue['Amount']) && orderValue['Currency Code'] === transactionValue['Currency']
    return Validator.renderType(label, Validator.renderCurrency(orderValue), Validator.renderCurrency(transactionValue), validation)
  }

  static renderCurrency(ast: SwiftAST) {
    return renderFloat((ast['Amount'] || '') + " " + (ast['Currency'] || ast['Currency Code']))
  }

  static renderFloat(floatSting: string, precision = 2) {
    return parseFloat(floatSting.replace(',', '.')).toFixed(precision)
  }

  static renderDate(date: Moment) {
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  }

  static renderType(label: string, valueLeft: string, valueRight: string, valid: boolean) : JSX.Element {
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
}

export default Validator;
