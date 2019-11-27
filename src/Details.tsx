import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import moment, {Moment} from 'moment';
import {
  Block4,
  findTypes,
  getAccountNumberFromFin,
  ParsedSwift,
  renderCurrency,
  renderDate,
  renderFloat,
  SwiftAST
} from "./utils"
import 'moment/locale/pl';
import './assets/css/App.css';

type TypeMapperReturn = string | JSX.Element | JSX.Element[] | Moment
type TypeMapper = (ast: SwiftAST) => TypeMapperReturn

const TYPES = {
  "Account number": {type: "97", option: "A"},
  "Dates": {type: "98", option: "A"},
  "Currency": {type: "19", option: "B"}
}

const FIELDS_DESCRIPTION: { [id: string]: string } = {
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

const TOOLTIPS: { [id: string]: string } = {
  "PAYD": "Payment Date/Time",
  "VALU": "Value Date/Time",
  "EARL": "Earliest Payment Date/Time",
  "FXDT": "FX Rate Fixing Date/Time",
  "ENTL": "Entitled Amount",
  "TXFR": "Tax Free Amount",
  'NETT': "Net Cash Amount"
}

interface DetailsProps {
  parsedSwift: ParsedSwift;
}

function Details(props: DetailsProps): JSX.Element {
  function renderRate(ast: SwiftAST): string {
    return ast['First Currency Code'] + '/' + ast['Second Currency Code'] + ' ' + renderFloat(ast['Rate'])
  }

  function renderType(label: string, value?: TypeMapperReturn, index?: number): JSX.Element {
    return (
      <React.Fragment key={index + label + value}>
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

  function renderIdentification(name = ''): JSX.Element[] {
    return name.split('\n').map((item: string, i: number) => {
      return <p key={i}>{item}</p>;
    })
  }

  function renderCustomField(type: string, option: string, name: string, mapper: TypeMapper): JSX.Element[] {
    const fields = findTypes(props.parsedSwift, type, option)

    return fields.map((field: Block4) => {
      return renderType(name, mapper(field.ast))
    })
  }

  function renderField(type: string, option: string | undefined, mapper: TypeMapper): JSX.Element[] {
    const fields = findTypes(props.parsedSwift, type, option)

    return fields.map((field: Block4) => {
      return renderType(FIELDS_DESCRIPTION[[type, option].join('')], mapper(field.ast))
    })
  }

  function renderCurrencyField(): JSX.Element[] {
    const {type, option} = TYPES["Currency"]
    const types = findTypes(props.parsedSwift, type, option)

    return types.map((type: Block4) => {
      return renderType(type.ast["Qualifier"] || '', renderCurrency(type.ast['Amount'], type.ast['Currency'] || type.ast['Currency Code']))
    })
  }

  function renderDates(): JSX.Element[] {
    const {type, option} = TYPES["Dates"]
    const types = findTypes(props.parsedSwift, type, option)

    return types.map((type: Block4, index: number) => {
      const date = moment(type.ast["Date"], "YYYYMMDD")
      return renderType(type.ast["Qualifier"] || '', date.format('DD/MM/YYYY') + " (" + date.fromNow() + ")", index)
    })
  }

  function renderAccountsNumber(): JSX.Element {
    const {type, option} = TYPES["Account number"]
    const types = findTypes(props.parsedSwift, type, option)

    return (
      <React.Fragment>
        {
          types.map((type: Block4, index: number) => {
            return renderType("Account Number (" + type.ast["Qualifier"] + ")", type.ast["Account Number"], index)
          })
        }
      </React.Fragment>
    )
  }

  return (
    <Row as="dl">
      {renderAccountsNumber()}
      {renderCurrencyField()}
      {renderDates()}
      {renderCustomField('83', 'J', 'Fund number', (ast: SwiftAST) => { return getAccountNumberFromFin(ast) })}
      {renderCustomField('58', 'J', 'Nostro number', (ast: SwiftAST) => { return getAccountNumberFromFin(ast) })}
      {renderField("92", "B", (ast: SwiftAST) => { return renderRate(ast) })}
      {renderField("20", undefined, (ast: SwiftAST) => { return ast['Value'] || '' })}
      {renderField("83", 'J', (ast: SwiftAST) => { return renderIdentification(ast['Party Identification']) })}
      {renderField("30", 'T', (ast: SwiftAST) => { return renderDate(ast['Date']) })}
      {renderField("30", 'V', (ast: SwiftAST) => { return renderDate(ast['Date']) })}
      {renderField("36", undefined, (ast: SwiftAST) => { return renderFloat(ast['Rate']) })}
      {renderField("32", 'B', (ast: SwiftAST) => { return renderCurrency(ast['Amount'], ast['Currency']) })}
      {renderField("33", 'B', (ast: SwiftAST) => { return renderCurrency(ast['Amount'], ast['Currency']) })}
      {renderField("53", 'A', (ast: SwiftAST) => { return ast['Identifier Code'] || '' })}
      {renderField("58", 'J', (ast: SwiftAST) => { return renderIdentification(ast['Party Identification'])})}
    </Row>
  )
}

export default Details;
