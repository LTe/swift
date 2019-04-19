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
        {this.renderCurrency()}
        {this.renderDates()}
      </Row>
    )
  }

  renderCurrency() {
    const types = this.findType(TYPES["Currency"])

    return types.map((type) => {
      return this.renderType(type.ast["Qualifier"],  parseFloat(type.ast["Amount"]).toFixed(2) + " " + type.ast["Currency Code"])
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
