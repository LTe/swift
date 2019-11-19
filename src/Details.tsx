import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import moment, {Moment} from 'moment';
import {renderDate, renderFloat, renderCurrency, getAccountNumberFromFin, SwiftAST, Block4} from "./utils"
import 'moment/locale/pl';
import './App.css';

type TypeMapperReturn = string | JSX.Element | JSX.Element[] | Moment
type TypeMapper = (ast: SwiftAST) => TypeMapperReturn

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
        {this.renderCustomField('83', 'J', 'Fund number', (ast: SwiftAST) => { return getAccountNumberFromFin(ast) })}
        {this.renderCustomField('58', 'J', 'Nostro number', (ast: SwiftAST) => { return getAccountNumberFromFin(ast) })}
        {this.renderField("92", "B", (ast: SwiftAST) => { return Details.renderRate(ast) })}
        {this.renderField("20", undefined, (ast: SwiftAST) => { return ast['Value'] || '' })}
        {this.renderField("83", 'J', (ast: SwiftAST) => { return Details.renderIdentification(ast['Party Identification']) })}
        {this.renderField("30", 'T', (ast: SwiftAST) => { return renderDate(ast['Date']) })}
        {this.renderField("30", 'V', (ast: SwiftAST) => { return renderDate(ast['Date']) })}
        {this.renderField("36", undefined, (ast: SwiftAST) => { return renderFloat(ast['Rate']) })}
        {this.renderField("32", 'B', (ast: SwiftAST) => { return renderCurrency(ast['Amount'], ast['Currency']) })}
        {this.renderField("33", 'B', (ast: SwiftAST) => { return renderCurrency(ast['Amount'], ast['Currency']) })}
        {this.renderField("53", 'A', (ast: SwiftAST) => { return ast['Identifier Code'] || '' })}
        {this.renderField("58", 'J', (ast: SwiftAST) => { return Details.renderIdentification(ast['Party Identification'])})}
      </Row>
    )
  }

  static renderRate(ast: SwiftAST) : string {
    return ast['First Currency Code'] + '/' + ast['Second Currency Code'] + ' ' + renderFloat(ast['Rate'])
  }

  static renderIdentification(name: string = '') : JSX.Element[] {
    return name.split('\n').map((item: string, i: number) => {
      return <p key={i}>{item}</p>;
    })
  }

  renderCustomField(type: string, option: string, name: string, mapper: TypeMapper) : JSX.Element[] {
    const fields = this.findType({type: type, option: option})

    return fields.map((field: Block4) => {
      return Details.renderType(name, mapper(field.ast))
    })
  }

  renderField(type: string, option: string | undefined, mapper: TypeMapper) : JSX.Element[] {
    const fields = this.findType({type: type, option: option})

    return fields.map((field: Block4) => {
      return Details.renderType(FIELDS_DESCRIPTION[[type, option].join('')], mapper(field.ast))
    })
  }

  renderCurrencyField() : JSX.Element[] {
    const types = this.findType(TYPES["Currency"])

    return types.map((type: Block4) => {
      return Details.renderType(type.ast["Qualifier"] || '', renderCurrency(type.ast['Amount'], type.ast['Currency'] || type.ast['Currency Code']))
    })
  }

  renderDates() : JSX.Element[] {
    const types = this.findType(TYPES["Dates"])

    return types.map((type: Block4) => {
      const date = moment(type.ast["Date"], "YYYYMMDD")
      return Details.renderType(type.ast["Qualifier"] || '', date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")")
    })
  }

  renderAccountsNumber() : JSX.Element[] {
    const types = this.findType(TYPES["Account number"])

    return types.map((type: Block4) => {
      return Details.renderType("Account Number (" + type.ast["Qualifier"] + ")" , type.ast["Account Number"])
    })
  }

  static renderType(label: string, value?: TypeMapperReturn) : JSX.Element {
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

  findType(attributes: {type: string, option?: string}) : Block4[] {
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
