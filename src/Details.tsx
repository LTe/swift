import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import moment from 'moment';
import {renderDate, renderFloat, renderCurrency, getAccountNumberFromFin} from "./utils"
import 'moment/locale/pl';

import './App.css';

const TYPES = {
  "Account number": {type: "97", option: "A"},
  "Dates": {type: "98", option: "A"},
  "Currency": {type: "19", option: "B"}
}

const FIELDS_DESCRIPTION: { [id: string] : string; } = {
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

const TOOLTIPS: { [id: string] : string; } = {
  "PAYD": "Payment Date/Time",
  "VALU": "Value Date/Time",
  "EARL": "Earliest Payment Date/Time",
  "FXDT": "FX Rate Fixing Date/Time",
  "ENTL": "Entitled Amount",
  "TXFR": "Tax Free Amount",
  'NETT': "Net Cash Amount"
}

class Details extends Component<any, any> {
  render() {
    return (
      <Row as="dl">
        {this.renderAccountsNumber()}
        {this.renderCurrencyField()}
        {this.renderDates()}
        {this.renderCustomField('83', 'J', 'Fund number', (ast: any) => { return getAccountNumberFromFin(ast) })}
        {this.renderCustomField('58', 'J', 'Nostro number', (ast: any) => { return getAccountNumberFromFin(ast) })}
        {this.renderField("92", "B", (ast: any) => { return this.renderRate(ast) })}
        {this.renderField("20", undefined, (ast: any) => { return ast['Value'] })}
        {this.renderField("83", 'J', (ast: any) => { return this.renderIdentification(ast['Party Identification']) })}
        {this.renderField("30", 'T', (ast: any) => { return renderDate(ast['Date']) })}
        {this.renderField("30", 'V', (ast: any) => { return renderDate(ast['Date']) })}
        {this.renderField("36", undefined, (ast: any) => { return renderFloat(ast['Rate']) })}
        {this.renderField("32", 'B', (ast: any) => { return renderCurrency(ast['Amount'], ast['Currency']) })}
        {this.renderField("33", 'B', (ast: any) => { return renderCurrency(ast['Amount'], ast['Currency']) })}
        {this.renderField("53", 'A', (ast: any) => { return ast['Identifier Code'] })}
        {this.renderField("58", 'J', (ast: any) => { return this.renderIdentification(ast['Party Identification'])})}
      </Row>
    )
  }

  renderRate(ast: any) {
    return ast['First Currency Code'] + '/' + ast['Second Currency Code'] + ' ' + renderFloat(ast['Rate'])
  }

  renderIdentification(name: any) {
    return name.split('\n').map((item: any, i: any) => {
      return <p key={i}>{item}</p>;
    })
  }

  renderCustomField(type: any, option: any, name: any, mapper: any) {
    const fields = this.findType({type: type, option: option})

    return fields.map((field: any) => {
      return this.renderType(name, mapper(field.ast))
    })
  }

  renderField(type: any, option: any, mapper: any) {
    const fields = this.findType({type: type, option: option})

    return fields.map((field: any) => {
      return this.renderType(FIELDS_DESCRIPTION[[type, option].join('')], mapper(field.ast))
    })
  }

  renderCurrencyField() {
    const types = this.findType(TYPES["Currency"])

    return types.map((type: any) => {
      return this.renderType(type.ast["Qualifier"],  renderCurrency(type.ast['Amount'], type.ast['Currency'] || type.ast['Currency Code']))
    })
  }

  renderDates() {
    const types = this.findType(TYPES["Dates"])

    return types.map((type: any) => {
      const date = moment(type.ast["Date"], "YYYYMMDD")
      return this.renderType(type.ast["Qualifier"], date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")")
    })
  }

  renderAccountsNumber() {
    const types = this.findType(TYPES["Account number"])

    return types.map((type: any) => {
      return this.renderType("Account Number (" + type.ast["Qualifier"] + ")" , type.ast["Account Number"])
    })
  }

  renderType(label: any, value: any) {
    return (
      <React.Fragment>
          <OverlayTrigger
            placement="left"
            overlay={
              <Tooltip id={label}>{TOOLTIPS[label] || "No information"}</Tooltip>
            }
          >
            <Col as="dt" xs={5}>{label}</Col>
          </OverlayTrigger>
        <Col as="dd" xs={7}>{value}</Col>
      </React.Fragment>
    )
  }

  findType(attributes: any) {
    const details = this.props.parsedSwift.block4
    if(details) {
      return details.filter((element: any)=> {
        return element.type === attributes.type && element.option === attributes.option
      })
    } else {
      return []
    }
  }
}

export default Details;
