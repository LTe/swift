import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Badge from 'react-bootstrap/Badge';
import moment from 'moment';
import 'moment/locale/pl';
import {getAccountNumberFromFin, findType, renderFloat} from './utils'

import './App.css';

class Validator extends Component {
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
          {this.validateNostoAccount()}
        </Row>
      </React.Fragment>
    )
  }

  validateFundAccount() {
    let orderAccount = findType(this.props.orderJSON, '97', 'A', 'SAFE')[0]
    let fundAccount = findType(this.props.transactionJSON, '83', 'J')[0]

    if(!orderAccount || !fundAccount) { return }

    let fundAccountNumber = getAccountNumberFromFin(fundAccount.ast)
    let orderAccountNumber = orderAccount.ast['Account Number']

    let matchingAccount = this.props.accounts.find((mapping) => {
      return orderAccountNumber.includes(mapping.account)
    }) || {fund: 'Unknow number'}

    let validation = matchingAccount.fund === fundAccountNumber

    return this.renderType('Fund Account Number', orderAccountNumber, matchingAccount.fund, validation)
  }

  validateNostoAccount() {
    let orderAccount = findType(this.props.orderJSON, '97', 'A', 'SAFE')[0]
    let nostroAccount = findType(this.props.transactionJSON, '58', 'J')[0]

    if(!orderAccount || !nostroAccount) { return }

    let nostroAccountNumber = getAccountNumberFromFin(nostroAccount.ast)
    let orderAccountNumber = orderAccount.ast['Account Number']

    let matchingAccount = this.props.accounts.find((mapping) => {
      return orderAccountNumber.includes(mapping.account)
    }) || {nostro: 'Unknow number'}

    let validation = matchingAccount.nostro === nostroAccountNumber

    return this.renderType('Nostro Account Number', '', matchingAccount.nostro, validation)
  }

  validateRate() {
    let orderRate = findType(this.props.orderJSON, '92', 'B', 'EXCH')[0]
    let rate = findType(this.props.transactionJSON, '36')[0]
    let buy = findType(this.props.transactionJSON, '32', 'B')[0]
    let sell = findType(this.props.transactionJSON, '33', 'B')[0]

    if(!rate || !buy || !sell || !orderRate) { return }

    buy = renderFloat(buy.ast['Amount'])
    sell = renderFloat(sell.ast['Amount'])
    rate = renderFloat(rate.ast['Rate'])
    orderRate = renderFloat(orderRate.ast['Rate'])
    const computedRate = (sell / buy).toFixed(2)

    return this.renderType('Rate', orderRate, rate + ' (Calculated: ' + computedRate + ')', rate === orderRate)
  }

  validateTradeDate() {
    let orderValue = findType(this.props.orderJSON, '98', 'A', 'VALU')[0]
    let transactionValue = findType(this.props.transactionJSON, '30', 'T')[0]

    if(!orderValue || !transactionValue) { return }

    orderValue = orderValue.ast
    transactionValue = transactionValue.ast

    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    let correctOrderValueDate = moment(orderValue['Date'], "YYYYMMDD")

    if(!moment().isAfter(orderValueDate)) { correctOrderValueDate = moment() }

    const validation = correctOrderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return this.renderType(
      'Trade Date',
      this.renderDate(orderValueDate),
      this.renderDate(correctOrderValueDate),
      validation)
  }

  validateValueDate() {
    let orderValue = findType(this.props.orderJSON,'98', 'A', 'VALU')[0]
    let transactionValue = findType(this.props.transactionJSON, '30', 'V')[0]

    if(!orderValue || !transactionValue) { return }

    orderValue = orderValue.ast
    transactionValue = transactionValue.ast

    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")
    const validation = orderValueDate.format('YYYYMMDD') === transactionValue['Date']

    return this.renderType('Value Date', this.renderDate(orderValueDate), this.renderDate(moment(transactionValue['Date'], 'YYYYMMDD')), validation)
  }


  validatePstaAmount() {
    let orderValue = findType(this.props.orderJSON,'19', 'B', 'PSTA')[0]
    let transactionValue = findType(this.props.transactionJSON, '32', 'B')[0]

    if(!orderValue || !transactionValue) { return }

    orderValue = orderValue.ast
    transactionValue = transactionValue.ast

    return this.renderAmountValidator(orderValue, transactionValue, 'Buy Currency Amount')
  }

  validateNettAmount() {
    let orderValue = findType(this.props.orderJSON, '19', 'B', 'NETT')[0]
    let transactionValue = findType(this.props.transactionJSON, '33', 'B')[0]

    if(!orderValue || !transactionValue) { return }

    orderValue = orderValue.ast
    transactionValue = transactionValue.ast

    return this.renderAmountValidator(orderValue, transactionValue, 'Sell Currency Amount')
  }

  renderAmountValidator(orderValue, transactionValue, label) {
    const validation = renderFloat(orderValue['Amount']) === renderFloat(transactionValue['Amount']) && orderValue['Currency Code'] === transactionValue['Currency']
    return this.renderType(label, this.renderCurrency(orderValue), this.renderCurrency(transactionValue), validation)
  }

  renderCurrency(ast) {
    return renderFloat(ast['Amount']) + " " + (ast['Currency'] || ast['Currency Code'])
  }

  renderFloat(floatSting, precision = 2) {
    return parseFloat(floatSting.replace(',', '.')).toFixed(precision)
  }

  renderDate(date) {
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  }

  renderType(label, valueLeft, valueRight, valid) {
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
