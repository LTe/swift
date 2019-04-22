import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Badge from 'react-bootstrap/Badge';
import moment from 'moment';
import 'moment/locale/pl';

import './App.css';

class Validator extends Component {
  render() {
    return (
      <Row>
        {this.validateNettAmount()}
        {this.validatePstaAmount()}
        {this.validateValueDate()}
        {this.validateTradeDate()}
        {this.validateRate()}
      </Row>
    )
  }

  validateRate() {
    const transactionValues = this.findType(this.props.transactionJSON, {type: '36', option: undefined})
    const transactionBuyValues = this.findType(this.props.transactionJSON, {type: '32', option: 'B'})
    const transactionSellValues = this.findType(this.props.transactionJSON, {type: '33', option: 'B'})

    if(!transactionValues.length || !transactionBuyValues.length || !transactionSellValues.length) { return }
    const buy = this.renderFloat(transactionBuyValues[0].ast['Amount'])
    const sell = this.renderFloat(transactionSellValues[0].ast['Amount'])
    const rate = this.renderFloat(transactionValues[0].ast['Rate'])

    let valid

    if((sell / buy).toFixed(2) === rate) {
      valid = true
    } else {
      valid = false
    }
    return this.renderType('Rate', (sell / buy).toFixed(2), rate, valid)
  }

  validateTradeDate() {
    const orderValues = this.findType(this.props.orderJSON, {type: '98', option: 'A'})
    const transactionValues = this.findType(this.props.transactionJSON, {type: '30', option: 'T'})

    if(!orderValues.length || !transactionValues.length) { return }

    const orderValue = orderValues.find((value) => { return value.ast["Qualifier"] === "VALU" }).ast
    const transactionValue = transactionValues[0].ast

    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")

    if(!moment().isAfter(orderValueDate)) {
      orderValueDate = moment()
    }

    let valid

    if(orderValueDate.format('YYYYMMDD') === transactionValue['Date']) {
      valid = true
    } else {
      valid = false
    }

    return this.renderType('Trade Date', this.renderDate(orderValueDate), this.renderDate(moment(transactionValue['Date'], 'YYYYMMDD')), valid)
  }

  validateValueDate() {
    const orderValues = this.findType(this.props.orderJSON, {type: '98', option: 'A'})
    const transactionValues = this.findType(this.props.transactionJSON, {type: '30', option: 'V'})

    if(!orderValues.length || !transactionValues.length) { return }

    const orderValue = orderValues.find((value) => { return value.ast["Qualifier"] === "VALU" }).ast
    const transactionValue = transactionValues[0].ast

    let orderValueDate = moment(orderValue['Date'], "YYYYMMDD")

    let valid

    if(orderValueDate.format('YYYYMMDD') === transactionValue['Date']) {
      valid = true
    } else {
      valid = false
    }

    return this.renderType('Value Date', this.renderDate(orderValueDate), this.renderDate(moment(transactionValue['Date'], 'YYYYMMDD')), valid)
  }

  renderDate(date) {
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  }

  validatePstaAmount() {
    const orderValues = this.findType(this.props.orderJSON, {type: '19', option: 'B'})
    const transactionValues = this.findType(this.props.transactionJSON, {type: '32', option: 'B'})

    if(!orderValues.length || !transactionValues.length) { return }
    const orderValue = orderValues.find((value) => { return value.ast["Qualifier"] === "PSTA" }).ast
    const transactionValue = transactionValues[0].ast

    return this.renderAmountValidator(orderValue, transactionValue, 'Buy Currency Amount')
  }

  validateNettAmount() {
    const orderValues = this.findType(this.props.orderJSON, {type: '19', option: 'B'})
    const transactionValues = this.findType(this.props.transactionJSON, {type: '33', option: 'B'})

    if(!orderValues.length || !transactionValues.length) { return }

    const orderValue = orderValues.find((value) => { return value.ast["Qualifier"] === "NETT" }).ast
    const transactionValue = transactionValues[0].ast

    return this.renderAmountValidator(orderValue, transactionValue, 'Sell Currency Amount')
  }

  renderAmountValidator(orderValue, transactionValue, label) {
    let valid

    if(this.renderFloat(orderValue['Amount']) === this.renderFloat(transactionValue['Amount']) && orderValue['Currency Code'] === transactionValue['Currency']) {
      valid = true
    } else {
      valid = false
    }

    return this.renderType(label, this.renderCurrency(orderValue), this.renderCurrency(transactionValue), valid)
  }

  renderCurrency(ast) {
    return this.renderFloat(ast['Amount']) + " " + (ast['Currency'] || ast['Currency Code'])
  }

  renderFloat(floatSting, precision = 2) {
    return parseFloat(floatSting.replace(',', '.')).toFixed(precision)
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

  findType(json, attributes) {
    const details = json['block4']
    if(details) {
      return details.filter((element)=> {
        return element.type === attributes.type && element.option === attributes.option
      })
    } else {
      return []
    }
  }
}

export default Validator;
