import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import moment from 'moment';
import 'moment/locale/pl';

import './App.css';

const TYPES = {
  "Account number": {type: "97", option: "A"},
  "Dates": {type: "98", option: "A"},
  "Currency": {type: "19", option: "B"}
}

const FIELDS_DESCRIPTION = {
  "20": "Sender's Reference",
  "38J": "Client",
  "83J": "Fund",
  "30T": "Trade Date",
  "30V": "Value Date",
  "36": "Exchange Rate",
  "32B": "Amount Bought",
  "53A": "Delivery Agent",
  "33B": "Amount Sold",
  "58J": "Beneficiary Institution",
  "92B": "Rate"
}

const TOOLTIPS = {
  "PAYD": "Payment Date/Time",
  "VALU": "Value Date/Time",
  "EARL": "Earliest Payment Date/Time",
  "FXDT": "FX Rate Fixing Date/Time",
  "ENTL": "Entitled Amount",
  "TXFR": "Tax Free Amount",
  'NETT': "Net Cash Amount"
}

class Details extends Component {
  render() {
    return (
      <Row as="dl">
        {this.renderAccountsNumber()}
        {this.renderCurrencyField()}
        {this.renderDates()}
        {this.renderCustomField('83', 'J', 'Fund number', (ast) => { return this.getAccountNumberFromFin(ast) })}
        {this.renderCustomField('58', 'J', 'Nostro number', (ast) => { return this.getAccountNumberFromFin(ast) })}
        {this.renderField("92", "B", (ast) => { return this.renderRate(ast) })}
        {this.renderField("20", undefined, (ast) => { return ast['Value'] })}
        {this.renderField("83", 'J', (ast) => { return this.renderIdentification(ast['Party Identification']) })}
        {this.renderField("30", 'T', (ast) => { return this.renderDate(ast['Date']) })}
        {this.renderField("30", 'V', (ast) => { return this.renderDate(ast['Date']) })}
        {this.renderField("36", undefined, (ast) => { return this.renderFloat(ast['Rate']) })}
        {this.renderField("32", 'B', (ast) => { return this.renderCurrency(ast['Amount'], ast['Currency']) })}
        {this.renderField("33", 'B', (ast) => { return this.renderCurrency(ast['Amount'], ast['Currency']) })}
        {this.renderField("53", 'A', (ast) => { return ast['Identifier Code'] })}
        {this.renderField("58", 'J', (ast) => { return this.renderIdentification(ast['Party Identification'])})}
      </Row>
    )
  }

  renderRate(ast) {
    return ast['First Currency Code'] + '/' + ast['Second Currency Code'] + ' ' + this.renderFloat(ast['Rate'])
  }

  renderIdentification(name) {
    return name.split('\n').map((item, i) => {
      return <p key={i}>{item}</p>;
    })
  }

  getAccountNumberFromFin(ast) {
    const identify = ast['Party Identification']
    return identify.split('\n').find((line) => { return line.includes('ACCT/') }).split('/')[2]
  }

  renderDate(dateString) {
    const date = moment(dateString, "YYYYMMDD")
    return date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")"
  }

  renderFloat(floatSting, precision = 2) {
    return parseFloat((floatSting || '').replace(',', '.')).toFixed(precision)
  }

  renderCurrency(amount, currency) {
    return this.renderFloat(amount) + " " + currency
  }

  renderCustomField(type, option, name, mapper) {
    const fields = this.findType({type: type, option: option})

    return fields.map((field) => {
      return this.renderType(name, mapper(field.ast))
    })
  }

  renderField(type, option, mapper) {
    const fields = this.findType({type: type, option: option})

    return fields.map((field) => {
      return this.renderType(FIELDS_DESCRIPTION[[type, option].join('')], mapper(field.ast))
    })
  }

  renderCurrencyField() {
    const types = this.findType(TYPES["Currency"])

    return types.map((type) => {
      return this.renderType(type.ast["Qualifier"],  this.renderCurrency(type.ast['Amount'], type.ast['Currency'] || type.ast['Currency Code']))
    })
  }

  renderDates() {
    const types = this.findType(TYPES["Dates"])

    return types.map((type) => {
      const date = moment(type.ast["Date"], "YYYYMMDD")
      return this.renderType(type.ast["Qualifier"], date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")")
    })
  }

  renderAccountsNumber() {
    const types = this.findType(TYPES["Account number"])

    return types.map((type) => {
      return this.renderType("Account Number (" + type.ast["Qualifier"] + ")" , type.ast["Account Number"])
    })
  }

  renderType(label, value) {

    return (
      <React.Fragment>
          <OverlayTrigger
            placement="left"
            overlay={
              <Tooltip>{TOOLTIPS[label] || "No information"}</Tooltip>
            }
          >
            <Col as="dt" xs={5}>{label}</Col>
          </OverlayTrigger>
        <Col as="dd" xs={7}>{value}</Col>
      </React.Fragment>
    )
  }

  findType(attributes) {
    const details = this.props.parsedSwift.block4
    if(details) {
      return details.filter((element)=> {
        return element.type === attributes.type && element.option === attributes.option
      })
    } else {
      return []
    }
  }
}

export default Details;
