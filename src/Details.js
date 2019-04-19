import React, { Component } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import moment from 'moment';
import 'moment/locale/pl';

import './App.css';

const TYPES = {
  "Account number": {type: "97", option: "A"},
  "Dates": {type: "98", option: "A"},
  "Currency": {type: "19", option: "B"}
}

class Details extends Component {
  render() {
    return (
      <Row as="dl">
        {this.renderAccountNumber()}
        {this.renderCurrency()}
        {this.renderDates()}
      </Row>
    )
  }

  renderCurrency() {
    const types = this.findType(TYPES["Currency"])
    if(!types.length) { return }

    return types.map((type) => {
      return this.renderType(type.ast["Qualifier"], type.ast["Amount"] + " " + type.ast["Currency Code"])
    })
  }

  renderDates() {
    const types = this.findType(TYPES["Dates"])
    if(!types.length) { return }

    return types.map((type) => {
      const date = moment(type.ast["Date"], "YYYYMMDD")
      return this.renderType(type.ast["Qualifier"], date.format('LL') + " (" + date.fromNow() + ")")
    })
  }

  renderAccountNumber() {
    const types = this.findType(TYPES["Account number"])
    if(!types.length) { return }
    return this.renderType("Account Number", types[0].ast["Account Number"])
  }


  renderType(label, value) {
    return (
      <React.Fragment>
        <Col as="dt" xs={5}>{label}</Col>
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
